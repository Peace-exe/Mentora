from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from os import getenv
import json
load_dotenv()
groqApiKey= getenv('GROQ_API_KEY')
if not groqApiKey: raise ValueError("GROQ_API_KEY is not set in .env")
    

ocrModel = ChatGroq(
    api_key=groqApiKey,
    model="llama-3.1-8b-instant"
)

llm = ChatGroq(
    api_key=groqApiKey,
    model = "llama-3.3-70b-versatile",
    temperature=0.7
)

def summarize_notice(ocr_text: str) -> str:
    response = ocrModel.invoke([
        HumanMessage(content=f"Summarize this notice concisely:\n\n{ocr_text}")
    ])
    return response.content

def generate_questions(chunk:str)->list[str]:
    prompt = f"""Given the following text, generate 3 hypothetical questions that a student might ask whose answer is contained in this text.
    
Return ONLY a JSON array of 3 questions, nothing else. No explanation, no markdown.
Example: ["question 1", "question 2", "question 3"]

Text:
{chunk}"""
    response = llm.invoke([
        HumanMessage(
            content=prompt
        )
    ])

    questions = json.loads(response.content.strip())
    
    return questions

