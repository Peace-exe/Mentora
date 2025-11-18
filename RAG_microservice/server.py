from fastapi import FastAPI
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

class userQuery(BaseModel):
    query: str

class facts(BaseModel):
    facts: list[str]

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
        return {"error": str(err)}

@app.post("/getEmbeddings/")
def getEmbeddings(facts: facts):
    response = generate_embeddings(facts.facts)
    return {"embeddings": response}

@app.post('/upsertFacts')
def uploadData(facts: facts):
    try:
        response = upsertFacts(facts.facts)
        return {
            'message': "Data upserted successfully!",
            'response': response 
        }
    except Exception as err:
        return JSONResponse(
            status_code=400,
            content={"error": str(err)}
        )

if __name__ == "__main__":
    public_url = start_ngrok()
    print(f"🚀 ngrok tunnel running on: {public_url}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
