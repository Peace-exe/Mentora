import os
import logging
from enum import Enum
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains.llm import LLMChain
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
from debug_logger import log_error

load_dotenv()

os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"
logging.getLogger("absl").setLevel(logging.ERROR)

# GLOBAL OBJECTS (PERSIST)
conversationMemory = None
chain = None

GEMENI_API_KEY = os.getenv('GOOGLE_API_KEY')

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",   
    temperature=0.9,
    google_api_key=GEMENI_API_KEY
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an AI assistant for Gautam Buddha University. "
               "Keep answers under 100 tokens. Sound natural and human."
               "If you do not know something you can politely be unaware of the answer."),
    ("system", "Conversation so far:\n{chat_history}"),
    ("system", "Here is some additional context you must use:\n{context}"),  
    ("human", "{user_query}")                             
])

class Status(str, Enum):
    on = "on"
    off = "off"


async def call_llm(query: str, context: str, status: Status) -> str:
    global conversationMemory, chain

    try:
        # TURN MEMORY ON
        if status == Status.on:

            # INIT memory if not already created
            if conversationMemory is None:
                conversationMemory = ConversationBufferMemory(
                    memory_key='chat_history',
                    input_key="user_query",
                    return_messages=False
                )

                chain = LLMChain(
                    llm=llm,
                    prompt=prompt,
                    memory=conversationMemory,
                    verbose=True
                )

            # RUN THE CHAIN
            response = await chain.apredict(
                user_query=query,
                context=context
            )
            return response

        # TURN MEMORY OFF
        elif status == Status.off:
            if conversationMemory is not None:
                conversationMemory.clear()
                conversationMemory = None
                chain = None
            return "Memory cleared"

    except Exception as err:
        log_error(err)
        return {"error": str(err)}
