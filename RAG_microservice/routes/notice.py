from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
from ocr.ocr import process_all
from fastapi.responses import JSONResponse
noticeRouter = APIRouter()

@noticeRouter.post("/storeNotice")
async def storeNotice(file: UploadFile = File(...)):

    
    SUPPORTED = {".pdf", ".jpg", ".jpeg", ".png"}

    try:
        
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        UPLOAD_DIR = os.path.join(BASE_DIR, "../ocr/inputImg")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = file.filename

        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED: raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

                                       
                      
        
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        res = process_all()

        return JSONResponse(
            status_code=201,
            content={
                "message":"Successfull",
                "data":res
            }
        )

        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wromg.\n{e}")

    

