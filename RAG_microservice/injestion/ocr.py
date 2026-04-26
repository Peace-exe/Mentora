import os
import base64
import io
import textwrap
import time
import json
from PIL import Image
from pdf2image import convert_from_path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

load_dotenv()

# --- config ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_DIR = os.path.join(BASE_DIR, "inputImg")
SUPPORTED = {".pdf", ".jpg", ".jpeg", ".png"}

llm = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens=2048,
)


# --- ocr function ---
def ocr_page(pil_image):
    buffer = io.BytesIO()

    pil_image = pil_image.resize(
        (pil_image.width // 2, pil_image.height // 2), 
        Image.LANCZOS
    )
    pil_image.save(buffer, format="JPEG", quality=85)

    b64 = base64.standard_b64encode(buffer.getvalue()).decode()


    prompt = textwrap.dedent("""
        You are a document parser for university notices. Extract and structure the content strictly.

        Field rules:
        - "response": factual summary of the content. Embed tables inline as HTML exactly where they appear in the original document. Plain text before and after tables. Do NOT use phrases like "The document", "The notice", "The order". State facts directly. Keep HTML tables as single-line strings with no newlines inside them.
        - "hasTable": true or false
        - "language": "hin" if Hindi dominant, "en" if English dominant
        - "hasURL": full URL string if found, false if not

        Example output:
        {
          "response": "Hostel mess exemption granted to Jatin Kumar (235UIT026) and Shivani Priya (225/UCA/037) for session 2024-25. <table><thead><tr><th>Sr. No.</th><th>Name</th><th>Roll No.</th><th>Recommendation</th></tr></thead><tbody><tr><td>1</td><td>Jatin Kumar</td><td>235UIT026</td><td>Hostel & Mess Exemption</td></tr><tr><td>2</td><td>Shivani Priya</td><td>225/UCA/037</td><td>Hostel & Mess Exemption</td></tr></tbody></table> Order to be displayed on notice boards and university website. Signed by Dr. Manmohan Singh, In-Charge Student Affairs.",
          "hasTable": true,
          "language": "en",
          "hasURL": false
        }

        Return ONLY the JSON object with exactly these 4 fields: "response", "hasTable", "language", "hasURL". No extra fields. No markdown. No backticks. Start with { and end with }.
    """).strip()
    
    message = HumanMessage(content=[
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"}
        },
        {
            "type": "text",
            "text": prompt
        }
    ])

    result = llm.invoke([message])

    raw = result.content.strip()

    # strip markdown code fences if LLM ignored your prompt
    if raw.startswith("```"):
        raw = raw.split("```")[1]  # get content between first pair of backticks
        if raw.startswith("json"):
            raw = raw[4:]          # strip the "json" language tag
        raw = raw.strip()
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  [WARN] JSON parse error: {e}")
        print(f"  [WARN] Raw response: {raw[:300]}")
        parsed = {
            "response": result.content,
            "hasTable": False,
            "language": "en",
            "hasURL": False
        }
    return parsed


# --- process all files ---
def process_all() -> list[dict]:
    os.makedirs(INPUT_DIR, exist_ok=True)

    files_to_process = [
        f for f in os.listdir(INPUT_DIR)
        if os.path.splitext(f)[1].lower() in SUPPORTED
    ]

    if not files_to_process:
        raise ValueError(f"No supported files found in {INPUT_DIR}")

    print(f"Found {len(files_to_process)} file(s): {files_to_process}")

    all_results = []
    try:
            
        for file_index, filename in enumerate(files_to_process):
            file_path = os.path.join(INPUT_DIR, filename)
            ext = os.path.splitext(filename)[1].lower()
            print(f"\nProcessing file: {filename}")

            if ext == ".pdf":
                pages = convert_from_path(file_path, dpi=200)
            else:
                pages = [Image.open(file_path).convert("RGB")]

            print(f"Total pages: {len(pages)}")

            for i, page in enumerate(pages):
                print(f"  Page {i+1}/{len(pages)}...")
                data = ocr_page(page)
                data["page"] = i + 1
                data["source_file"] = filename
                all_results.append(data)
                print(f"    language: {data['language']} | hasTable: {data['hasTable']}")

                
    finally:
        for filename in files_to_process:
            file_path = os.path.join(INPUT_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
        print(f"Cleaned up {len(files_to_process)} file(s) from {INPUT_DIR}")    

    print(f"\nDone. Processed {len(all_results)} page(s) across {len(files_to_process)} file(s).")
    return all_results