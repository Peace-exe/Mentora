import os
import logging
from enum import Enum

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage

from pydantic import BaseModel, Field
from dotenv import load_dotenv
from debug_logger import log_error

load_dotenv()

os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"
logging.getLogger("absl").setLevel(logging.ERROR)

# GLOBAL memory store
memory_store = {}  # session_id → ChatMessageHistory


class QAresponse(BaseModel):
    answer: str
    knowsAnswer: bool = Field(description="Return false if unsure")


GEMENI_API_KEY = os.getenv('GOOGLE_API_KEY')

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.9,
    google_api_key=GEMENI_API_KEY
)

prompt = ChatPromptTemplate.from_messages([
    ("system",
     "You are an AI assistant for Gautam Buddha University. "
     "You MUST return a JSON object following this schema: "
     "{{ answer: string, knowsAnswer: boolean }}. "
     "If you are unsure, set knowsAnswer to false."
     ),
    ("system", "Conversation so far:\n{history}"),
    ("system", "Additional context:\n{context}"),
    ("human", "{user_query}")
])


class Status(str, Enum):
    on = "on"
    off = "off"


def get_or_create_history(session_id: str) -> ChatMessageHistory:
    if session_id not in memory_store:
        memory_store[session_id] = ChatMessageHistory()
    return memory_store[session_id]


def format_chat_history(history: ChatMessageHistory) -> str:
    return "\n".join(
        f"{'User' if isinstance(m, HumanMessage) else 'AI'}: {m.content}"
        for m in history.messages
    )


async def call_llm(query: str, context: str, status: Status) -> str:
    SESSION_ID = "abc"

    try:
        # MEMORY OFF
        if status == Status.off:
            memory_store.pop(SESSION_ID, None)
            return "Memory cleared"

        # MEMORY ON
        history = get_or_create_history(SESSION_ID)
        formatted_history = format_chat_history(history)

        # Pretty print context like LangChain verbose style
        print(f"\033[92m================= CONTEXT =================\n{context}\n==========================================\033[0m")
        print(f"\033[96m================= HISTORY =================\n{formatted_history or '[empty]'}\n===========================================\033[0m")

        # Structured output call
        structuredLLM = llm.with_structured_output(QAresponse)
        chain = prompt | structuredLLM
        response: QAresponse = await chain.ainvoke({
            "history": formatted_history,
            "context": context,
            "user_query": query
        })

        # Save to memory
        history.add_user_message(query)
        history.add_ai_message(response.answer)

        if not response.knowsAnswer:
            return "Model does not know the answer to this query. Please contact the concerning authority."

        return response.answer

    except Exception as err:
        log_error(err)
        raise RuntimeError({"error": str(err)})
