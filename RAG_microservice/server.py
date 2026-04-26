from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from config.ngrok import start_ngrok
from llm import call_llm, Status
from getEmbeddings import generate_embeddings
from context import context
from getEmbeddings import load_model_once
from debug_logger import log_error
from store_embeddings import upsertFacts
import os
from routes.notice import noticeRouter
from routes.injestion import injestionRouter
from contextlib import asynccontextmanager
from config.database import connectDB, disconnectDB
from injestion.chunker import semantic_chunking
from config.groq import generate_questions

class userQuery(BaseModel):
    query: str

class recordInfo(BaseModel):
    facts: list[str]
    category:str
    subcategory:str
    department:str
    idPrefix:str

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = await connectDB()
    yield
    await disconnectDB(client)


app = FastAPI(lifespan=lifespan)
load_model_once()


@app.post("/callLLM")
async def process_data(query: userQuery, status: Status):
    try:
        contextString = context(query.query)
        llmResponse = await call_llm(query.query, contextString, status)
        return {"response": llmResponse}
    except Exception as err:
        log_error(err)
        return JSONResponse(
            status_code=400,
            content={"error": str(err)}
        )

@app.post("/getEmbeddings/")
def getEmbeddings(facts: recordInfo):
    response = generate_embeddings(facts.facts)
    return {"embeddings": response}


@app.post('/upsertRecords')
def upsertRecords(records: recordInfo):
    try:
        recordsList = records.facts
        category = records.category
        subcategory = records.subcategory
        department = records.department
        idPrefix = records.idPrefix

        response = upsertFacts(
            recordsList, category, subcategory, department, idPrefix
        )

        return {
            'message': "Data upserted successfully!",
            'response': response 
        }

    except Exception as err:
        return JSONResponse(
            status_code=400,
            content={"error": str(err)}
        )

app.include_router(noticeRouter, prefix="/notice")
app.include_router(injestionRouter, prefix="/injestion")

@app.get("/test")
def test():
    fact = "Gautam Buddha University (GBU) offers 160+ courses across eight schools with admissions for 2026-27 primarily conducted through the Samarth portal and CUET system. To apply, students must visit the official website at gbu.ac.in, create an account using a valid email or phone number, fill in personal and academic details, choose their desired courses, upload scanned copies of required documents including photograph, signature, educational documents, and category certificates, pay the application fee online, submit the form, and download the confirmation page for future reference. Selection is primarily entrance-based — for UG and PG courses, GBU is adopting CUET for up to 50% of seats for 2026-27; B.Tech accepts JEE Main, CUET, or GBU-ET scores; MBA accepts CAT, MAT, XAT, CMAT, GMAT, or GBU-ET scores; B.Arch requires a valid NATA score along with 10+2 or 10+3 marks; and some programs like M.Tech offer merit-based or direct admission routes. For any queries, students can reach the admissions office at admissions@gbu.ac.in or call 0120-2344234 or 0120-2344247."
    
    chunks = semantic_chunking(fact)

    HyQues= []
    for chunk in chunks:
        ques = generate_questions(chunk)
        HyQues.append(ques)
    return {
        "chunks":chunks,
        "HyQues":HyQues

    }

    


if __name__ == "__main__":
    public_url = start_ngrok()
    print(f"🚀 ngrok tunnel running on: {public_url}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
