from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from ngrok_config import start_ngrok
from llm import call_llm, Status
from getEmbeddings import generate_embeddings
from context import context
from getEmbeddings import load_model_once
from debug_logger import log_error
from store_embeddings import upsertFacts
import os
import shutil
from ocr.main import process_file
from config.groq import summarize_notice

class userQuery(BaseModel):
    query: str

class recordInfo(BaseModel):
    facts: list[str]
    category:str
    subcategory:str
    department:str
    idPrefix:str


app = FastAPI()
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

@app.post('/storeNotice')
async def upsertNotice(file: UploadFile = File(...)):

    UPLOAD_DIR = "ocr/input"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
    
    try:
            
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Only PDFs and images allowed")
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        extractedText = process_file(UPLOAD_DIR)

        res = summarize_notice(extractedText)

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Something went wrong.\n{str(e)}")


if __name__ == "__main__":
    public_url = start_ngrok()
    print(f"🚀 ngrok tunnel running on: {public_url}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
