from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from getEmbeddings import generate_embeddings
from config.pinecone import index
from models.universityInfo import UniversityInfo, ChunkProjection
from bson import ObjectId
from config.groq import generate_response
retrievalRouter = APIRouter()

class UserQuery(BaseModel):
    query: str 
@retrievalRouter.post("/query")
async def getResponse(body: UserQuery):
    try:
        query = body.query

        # Step 1: Embed query
        try:
            embeddings = generate_embeddings(query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

        # Step 2: Pinecone retrieval
        try:
            results = index.query(
                vector=embeddings,
                top_k=20,
                include_metadata=True
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Pinecone query failed: {str(e)}")

        relevant_chunks = [
            {
                "id": m["id"],
                "score": m["score"],
                "metadata": m["metadata"]
            }
            for m in results["matches"] if m["score"] >= 0.7
        ]

        if not relevant_chunks:
            raise HTTPException(status_code=404, detail="No relevant information found for your query.")

        # Step 3: Deduplicate
        seen = set()
        unique_pairs = []
        for m in relevant_chunks:
            key = (m["metadata"]["mongoId"], int(m["metadata"]["chunkNo"]))
            if key not in seen:
                seen.add(key)
                unique_pairs.append(key)

        mongo_ids = list(set([pair[0] for pair in unique_pairs]))

        # Step 4: MongoDB fetch
        try:
            docs = {
                str(doc.id): doc
                for doc in await UniversityInfo.find(
                    {"_id": {"$in": [ObjectId(id) for id in mongo_ids]}}
                ).project(ChunkProjection).to_list()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database fetch failed: {str(e)}")

        if not docs:
            raise HTTPException(status_code=404, detail="Could not retrieve documents from database.")

        # Step 5: Build context + meta
        context_chunks = []
        meta = {
            "hasTable": False,
            "hasURL": False,
            "hasMobileNo": False,
            "hasEmail": False,
            "lang": "en"
        }

        for mongoId, chunkNo in unique_pairs:
            doc = docs.get(mongoId)
            if doc and doc.chunks and chunkNo < len(doc.chunks):
                context_chunks.append(doc.chunks[chunkNo])
                if doc.hasTable: meta["hasTable"] = True
                if doc.hasURL: meta["hasURL"] = True
                if doc.hasMobileNo: meta["hasMobileNo"] = True
                if doc.hasEmail: meta["hasEmail"] = True
                if doc.lang == "hin": meta["lang"] = "hin"

        if not context_chunks:
            raise HTTPException(status_code=404, detail="No relevant chunks could be extracted.")

        # Step 6: LLM response
        try:
            llmResponse = await generate_response(context_chunks, query)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM response generation failed: {str(e)}")

        return {
            "response": llmResponse,
            "hasTable": meta["hasTable"],
            "hasURL": meta["hasURL"],
            "hasMobileNo": meta["hasMobileNo"],
            "hasEmail": meta["hasEmail"],
            "lang": meta["lang"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
