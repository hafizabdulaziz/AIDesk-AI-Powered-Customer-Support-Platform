import logging
from typing import List, Dict, Optional
from services.vector_store import vector_store
from .embeddings import EmbeddingService

# Setup logger
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.collection_name = "support_kb"

    def retrieve_relevant_chunks(self, query: str, k: int = 3) -> List[Dict[str, str]]:
        """
        Retrieves the most relevant document chunks from the vector store based on the user query.
        """
        if not query or not query.strip():
            logger.warning("Empty query provided for RAG retrieval.")
            return []

        try:
            # 1. Embed the user query
            # This call may raise RuntimeError if API fails
            query_embedding = self.embedding_service.get_embedding(query)
            
            if query_embedding is None:
                logger.warning("Embedding service returned None for query: %s", query)
                return []

            # 2. Query the vector store
            collection = vector_store.get_or_create_collection(self.collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=max(1, k)
            )
            
            # 3. Format results
            formatted_results = []
            if results and results.get("documents") and results["documents"][0]:
                # Use zip to pair documents with their corresponding metadata
                for doc, meta in zip(results["documents"][0], results.get("metadatas", [[]])[0]):
                    formatted_results.append({
                        "content": doc,
                        "source": meta.get("source", "unknown") if meta else "unknown"
                    })
            
            return formatted_results

        except RuntimeError as e:
            logger.error(f"RAG retrieval failed due to embedding error: {str(e)}")
            # Return empty list instead of crashing, the AI agent will handle the lack of context
            return []
        except Exception as e:
            logger.exception(f"Unexpected error during RAG retrieval: {str(e)}")
            return []
