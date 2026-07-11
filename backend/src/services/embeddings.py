from langchain_openai import OpenAIEmbeddings
from core.config import settings

class EmbeddingService:
    def __init__(self):
        # Configure OpenAI embeddings to use Gemini's compatible API
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            openai_api_base=settings.API_BASE_URL,
            model=settings.EMBEDDING_MODEL
        )

    def get_embedding(self, text: str):
        return self.embeddings.embed_query(text)

# Singleton instance
embedding_service = EmbeddingService()
