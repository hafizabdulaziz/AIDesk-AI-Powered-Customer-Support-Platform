from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import os
import shutil
from services.file_processor import file_processor
from services.vector_store import vector_store

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.post("/kb/upload")
async def upload_document(file: UploadFile = File(...)):
    # Create temp directory if not exists
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        file_processor.process_and_index(file_path, file.filename)
        return {"message": f"Successfully processed and indexed {file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/kb/documents")
async def list_documents():
    try:
        collection = vector_store.get_or_create_collection("support_kb")
        results = collection.get()
        
        # Format results to return unique sources
        documents = []
        seen_sources = set()
        
        if results and results['metadatas']:
            for i, meta in enumerate(results['metadatas']):
                source = meta.get('source', 'unknown')
                if source not in seen_sources:
                    documents.append({
                        "id": results['ids'][i],
                        "source": source,
                        "content_preview": results['documents'][i][:100] + "..." if results['documents'] else ""
                    })
                    seen_sources.add(source)
        
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/kb/document/{source}")
async def delete_document(source: str):
    try:
        collection = vector_store.get_or_create_collection("support_kb")
        collection.delete(where={"source": source})
        return {"message": f"Deleted all entries for source: {source}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
