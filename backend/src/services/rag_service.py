from services.vector_store import vector_store
from services.embeddings import embedding_service
from core.config import settings

class RAGService:
    def __init__(self, collection_name: str = "kb_documents"):
        self.collection = vector_store.get_or_create_collection(collection_name)

    def retrieve_documents(self, query: str, n_results: int = 3):
        if settings.MOCK_MODE:
            return ["Dummy context 1", "Dummy context 2"]
        # Generate embedding for the query
        query_embedding = embedding_service.get_embedding(query)
        
        # Query the vector store
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        return results["documents"][0] if results["documents"] else []

# Singleton instance
rag_service = RAGService()
