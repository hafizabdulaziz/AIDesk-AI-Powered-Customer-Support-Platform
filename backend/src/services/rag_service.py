from typing import List, Dict
from services.vector_store import vector_store
from .embeddings import EmbeddingService

class RAGService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.collection_name = "support_kb"

    def retrieve_relevant_chunks(self, query: str, k: int = 3) -> List[Dict[str, str]]:
        # 1. Embed the user query
        query_embedding = self.embedding_service.get_embedding(query)
        
        # 2. Query the vector store
        collection = vector_store.get_or_create_collection(self.collection_name)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        # 3. Format results
        formatted_results = []
        if results["documents"] and results["documents"][0]:
            for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                formatted_results.append({
                    "content": doc,
                    "source": meta.get("source", "unknown")
                })
        
        return formatted_results
