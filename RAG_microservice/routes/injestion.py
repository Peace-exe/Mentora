from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Literal
import re

from injestion.chunker import semantic_chunking
from config.groq import generate_questions
from models.universityInfo import UniversityInfo
from config.pinecone import index
from getEmbeddings import generate_embeddings

injestionRouter = APIRouter()

class info(BaseModel):
    info: str
    infoId: str
    category: str
    source: str
    lang: Literal["en", "hin"] = "en"


@injestionRouter.post("/upsertInfo")
async def upsertInfo(body: info):
    fullInfo = body.info
    storedDoc = None

    try:
        # --- feature detection ---
        has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', fullInfo))
        has_mobile = bool(re.search(
            r'(\+91[\s-]?)?[6-9]\d{9}'           # Indian mobile
            r'|(\+?[1-9]\d{0,2}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}'  # international
            r'|0\d{2,4}[\s-]?\d{6,8}'            # landline with STD code
            r'|1[0-9]{3}'                         # toll free 1800, 1860, 1900
            r'|1800[\s-]?\d{3}[\s-]?\d{3,4}',    # toll free with spaces
            fullInfo
        ))
        has_url = bool(re.search(r'https?://\S+|www\.\S+', fullInfo))
        has_table = bool(re.search(r'<table[\s>]', fullInfo, re.IGNORECASE))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature detection failed: {str(e)}")

    try:
        # --- chunking ---
        chunks = semantic_chunking(fullInfo)
        if not chunks:
            raise ValueError("Chunking returned empty result")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chunking failed: {str(e)}")

    try:
        # --- hypothetical question generation ---
        hyQues = [generate_questions(chunk) for chunk in chunks]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hypothetical question generation failed: {str(e)}")

    try:
        # --- mongodb insert ---
        doc = UniversityInfo(
            info=fullInfo,
            infoId=body.infoId,
            category=body.category,
            source=body.source,
            lang=body.lang,
            hasTable=has_table,
            hasURL=has_url,
            hasMobileNo=has_mobile,
            hasEmail=has_email,
            chunks=chunks,
            hyQues=hyQues
        )
        storedDoc = await doc.insert()
        mongoId = str(storedDoc.id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB insert failed: {str(e)}")

    try:
        # --- pinecone upsert ---
        vectors = []

        chunk_embeddings = generate_embeddings(chunks)
        for chunk_idx, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
            vectors.append({
                "id": f"{mongoId}_chunk{chunk_idx}",
                "values": embedding,
                "metadata": {
                    "mongoId": mongoId,
                    "chunkNo": chunk_idx,
                    "type": "chunk",
                    "category": body.category
                }
            })

        for chunk_idx, questions in enumerate(hyQues):
            q_embeddings = generate_embeddings(questions)
            for q_idx, (question, embedding) in enumerate(zip(questions, q_embeddings)):
                vectors.append({
                    "id": f"{mongoId}_chunk{chunk_idx}_q{q_idx}",
                    "values": embedding,
                    "metadata": {
                        "mongoId": mongoId,
                        "chunkNo": chunk_idx,
                        "type": "hyQue",
                        "category": body.category
                    }
                })

        index.upsert(vectors=vectors)

    except Exception as e:
        # pinecone failed — rollback mongodb insert
        if storedDoc:
            await storedDoc.delete()
            print(f"🔄 Rolled back MongoDB insert for {mongoId}")
        raise HTTPException(status_code=500, detail=f"Pinecone upsert failed, MongoDB insert rolled back: {str(e)}")

    return JSONResponse(content={
        "success": True,
        "mongoId": mongoId,
        "totalChunks": len(chunks),
        "totalVectors": len(vectors),
        "chunks": chunks,
        "hyQues": hyQues
    })