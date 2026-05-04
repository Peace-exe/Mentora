from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Literal
import re
from injestion.chunker import semantic_chunking
from config.groq import generate_questions
from models.universityInfo import UniversityInfo
from config.pinecone import index
from getEmbeddings import generate_embeddings
import os
import shutil
from injestion.ocr import process_files
from middlewares.auth import require_role

injestionRouter = APIRouter()

class info(BaseModel):
    info: str
    infoId: str
    category: str
    source: str
    lang: Literal["en", "hin"] = "en"


@injestionRouter.post("/upsertInfo")
async def upsertInfo(body: info, dep = Depends(require_role("admin"))):

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


@injestionRouter.post("/storeNotice")
async def storeNotice(
    file: UploadFile = File(...),
    infoId: str = Form(...),
    category: str = Form(...),
    dep=Depends(require_role("admin"))
):
    SUPPORTED = {".pdf", ".jpg", ".jpeg", ".png"}

    try:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        UPLOAD_DIR = os.path.join(BASE_DIR, "../ocr/inputImg")
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        pages = process_files()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")

    all_mongoIds = []
    all_chunks = []
    all_hyQues = []
    all_vectors_count = 0

    for page in pages:
        fullInfo = page["response"]
        storedDoc = None

        has_table = page["hasTable"]
        has_url = bool(page["hasURL"])
        has_mobile = bool(page["hasMobileNo"])
        has_email = bool(page["hasEmail"])

        try:
            chunks = semantic_chunking(fullInfo)
            if not chunks:
                raise ValueError("Chunking returned empty result")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Chunking failed on page {page['page']}: {e}")

        try:
            hyQues = [generate_questions(chunk) for chunk in chunks]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Hypothetical question generation failed on page {page['page']}: {e}")

        try:
            doc = UniversityInfo(
                info=fullInfo,
                infoId=f"{infoId}_p{page['page']}",
                category=category,
                source=page["source_file"],
                lang=page["language"],
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
            raise HTTPException(status_code=500, detail=f"MongoDB insert failed on page {page['page']}: {e}")

        try:
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
                        "category": category
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
                            "category": category
                        }
                    })

            index.upsert(vectors=vectors)

        except Exception as e:
            if storedDoc:
                await storedDoc.delete()
                print(f"🔄 Rolled back MongoDB insert for {mongoId}")
            raise HTTPException(status_code=500, detail=f"Pinecone upsert failed on page {page['page']}, MongoDB rolled back: {e}")

        all_mongoIds.append(mongoId)
        all_chunks.extend(chunks)
        all_hyQues.extend(hyQues)
        all_vectors_count += len(vectors)

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "mongoId": all_mongoIds[0] if len(all_mongoIds) == 1 else all_mongoIds,
            "totalChunks": len(all_chunks),
            "totalVectors": all_vectors_count,
            "chunks": all_chunks,
            "hyQues": all_hyQues,
        }
    )