import logging
import PyPDF2
from typing import List, Dict
from services.vector_store import vector_store
from services.embeddings import PseudoEmbeddingService
import uuid

# Setup logger
logger = logging.getLogger(__name__)

class FileProcessingService:
    def __init__(self):
        self.embedding_service = PseudoEmbeddingService()
        self.collection = vector_store.get_or_create_collection("support_kb")

    def process_and_index(self, file_path: str, filename: str):
        """
        Parses text/pdf files, chunks them, generates embeddings, 
        and adds to ChromaDB.
        """
        text = ""
        if filename.endswith('.pdf'):
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text()
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()

        # Simple chunking (e.g., by paragraph or fixed size)
        chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
        
        for chunk in chunks:
            embedding = self.embedding_service.get_embedding(chunk)
            self.collection.add(
                ids=[str(uuid.uuid4())],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{"source": filename}]
            )
        
        logger.info(f"Successfully processed and indexed {filename}")

file_processor = FileProcessingService()
