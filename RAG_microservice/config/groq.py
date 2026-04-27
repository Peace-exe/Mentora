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

openai = ChatGroq(
    api_key=groqApiKey,
    model="openai/gpt-oss-120b",
    temperature=0.8
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


async def generate_response(context: list[str], query: str):
    context_str = "\n\n---\n\n".join(context)
    
    prompt = f"""You are Mentora, an intelligent assistant for university-related queries.
                Answer the user's question using ONLY the provided context.
                If the answer is not in the context, say "I don't have information about this."

                RULES:
                - Format your response in Markdown.
                - If the context contains a table, include it AS-IS in your response.
                - If the context contains emails, phone numbers, or URLs, include them exactly as they appear — do not modify them.
                - Use **bold** for important terms, bullet points for lists, and headings where needed.
                - Keep your answer concise and well-structured.
                - Do not make up any information.

                CONTEXT:
                {context_str}

                QUESTION:
                {query}

                ANSWER:"""

    response = await openai.ainvoke([
        HumanMessage(content=prompt)
    ])

    return response.content


