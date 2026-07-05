import os
from openai import OpenAI
from .core.config import settings

class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "text-embedding-3-small"

    def get_embedding(self, text: str):
        # In a real app, we'd handle API errors and retries
        response = self.client.embeddings.create(
            input=[text],
            model=self.model
        )
        return response.data[0].embedding
