from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from os import getenv

load_dotenv()
groqApiKey= getenv('GROQ_API_KEY')
if not groqApiKey: raise ValueError("GROQ_API_KEY is not set in .env")
    

llm = ChatGroq(
    api_key=groqApiKey,
    model="llama-3.1-8b-instant"
)

def summarize_notice(ocr_text: str) -> str:
    response = llm.invoke([
        HumanMessage(content=f"Summarize this notice concisely:\n\n{ocr_text}")
    ])
    return response.content


