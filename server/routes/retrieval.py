from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from getEmbeddings import generate_embeddings
from config.pinecone import index
from models.universityInfo import UniversityInfo, ChunkProjection
from bson import ObjectId
from config.groq import generate_response
from middlewares.wsAuth import ws_require_role

retrievalRouter = APIRouter()

@retrievalRouter.websocket("/query")
async def getResponse(websocket: WebSocket):
    
    user = await ws_require_role(websocket, "admin", "user")
    if not user:
        return

    try:
        while True:
            body = await websocket.receive_json()
            query = body.get("query", "").strip()

            if not query:
                await websocket.send_json({"success": False, "error": "Query is required"})
                continue

            # Step 1: Embed query
            try:
                embeddings = generate_embeddings(query)
            except Exception as e:
                await websocket.send_json({"success": False, "error": f"Embedding generation failed: {str(e)}"})
                continue

            # Step 2: Pinecone retrieval
            try:
                results = index.query(vector=embeddings, top_k=20, include_metadata=True)
            except Exception as e:
                await websocket.send_json({"success": False, "error": f"Pinecone query failed: {str(e)}"})
                continue

            relevant_chunks = [
                {"id": m["id"], "score": m["score"], "metadata": m["metadata"]}
                for m in results["matches"] if m["score"] >= 0.7
            ]

            # Step 3: Deduplicate
            seen = set()
            unique_pairs = []
            for m in relevant_chunks:
                key = (m["metadata"]["mongoId"], int(m["metadata"]["chunkNo"]))
                if key not in seen:
                    seen.add(key)
                    unique_pairs.append(key)

            mongo_ids = list(set([pair[0] for pair in unique_pairs]))

            # Step 4: MongoDB fetch — sirf tab jab chunks mile hon
            context_chunks = []
            meta = {
                "hasTable": False, "hasURL": False,
                "hasMobileNo": False, "hasEmail": False, "lang": "en"
            }

            if unique_pairs:
                try:
                    docs = {
                        str(doc.id): doc
                        for doc in await UniversityInfo.find(
                            {"_id": {"$in": [ObjectId(id) for id in mongo_ids]}}
                        ).project(ChunkProjection).to_list()
                    }
                except Exception as e:
                    await websocket.send_json({"success": False, "error": f"Database fetch failed: {str(e)}"})
                    continue

                for mongoId, chunkNo in unique_pairs:
                    doc = docs.get(mongoId)
                    if doc and doc.chunks and chunkNo < len(doc.chunks):
                        context_chunks.append(doc.chunks[chunkNo])
                        if doc.hasTable: meta["hasTable"] = True
                        if doc.hasURL: meta["hasURL"] = True
                        if doc.hasMobileNo: meta["hasMobileNo"] = True
                        if doc.hasEmail: meta["hasEmail"] = True
                        if doc.lang == "hin": meta["lang"] = "hin"

            
            # Step 5: LLM — empty context bhi bhejo, LLM handle karega
            try:
                await generate_response(context_chunks, query, websocket)
            except Exception as e:
                await websocket.send_json({"success": False, "error": f"LLM response generation failed: {str(e)}"})
                continue

            await websocket.send_json({
                "success": True,
                "token": "",
                "done": True,
                "hasTable": meta["hasTable"],
                "hasURL": meta["hasURL"],
                "hasMobileNo": meta["hasMobileNo"],
                "hasEmail": meta["hasEmail"],
                "lang": meta["lang"]
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"success": False, "error": f"Unexpected error:{str(e)}"})
