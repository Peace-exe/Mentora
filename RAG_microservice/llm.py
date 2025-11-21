import os
import logging
from enum import Enum
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
#from langchain.chains.llm import LLMChain
from langchain.memory import ConversationBufferMemory
#from langchain_core.runnables import RunnableSequence
from pydantic import BaseModel,Field
from dotenv import load_dotenv
from debug_logger import log_error

load_dotenv()

os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GLOG_minloglevel"] = "2"
logging.getLogger("absl").setLevel(logging.ERROR)

# GLOBAL OBJECTS (PERSIST)
conversationMemory = None
chain = None

class QAresponse(BaseModel):
    answer : str
    knowsAnswer:bool = Field(description="Return false if the model is unsure")

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
     "Keep the answer concise **when the question can be answered briefly**, "
     "but if detailed explanation is required, you may exceed the usual length "
     "to maintain clarity and completeness. "
     "If you are unsure or lack the information, set knowsAnswer to false."
    ),
    ("system", "Conversation so far:\n{chat_history}"),
    ("system", "Additional context:\n{context}"),
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

                structuredLLM = llm.with_structured_output(QAresponse)
                '''
                chain = LLMChain(
                    llm=structuredLLM,
                    prompt=prompt,
                    memory=conversationMemory,
                    verbose=True
                )
                '''
                chain= prompt | structuredLLM

            chat_history = conversationMemory.load_memory_variables({}).get("chat_history", "")

            # RUN THE CHAIN
            response: QAresponse = await chain.ainvoke({
                "user_query": query,
                "context": context,
                "chat_history": chat_history
            })

            if not response.knowsAnswer:
                
                return "Model does not know the answer to this query please contact the concerning authority."
            
                
            conversationMemory.save_context(
                {"user_query": query},
                {"answer": response.answer}
            )

            return response.answer

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
