import chromadb
from core.config import settings

class VectorStoreManager:
    def __init__(self):
        # Initialize the persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        
    def get_or_create_collection(self, collection_name: str):
        return self.client.get_or_create_collection(name=collection_name)

# Singleton instance for the application
vector_store = VectorStoreManager()
