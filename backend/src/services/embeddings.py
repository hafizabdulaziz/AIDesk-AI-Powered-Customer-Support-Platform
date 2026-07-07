import logging
from openai import OpenAI, OpenAIError
from core.config import settings

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class EmbeddingService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "text-embedding-3-small"

    def get_embedding(self, text: str):
        """
        Generates an embedding for the given text using OpenAI's embedding model.
        Includes error handling for API-related failures.
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding.")
            return None

        try:
            response = self.client.embeddings.create(
                input=[text],
                model=self.model
            )
            return response.data[0].embedding
        except OpenAIError as e:
            logger.error(f"OpenAI API error during embedding generation: {str(e)}")
            # We raise a custom or general exception to be handled by the service layer
            raise RuntimeError(f"Failed to generate embedding: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during embedding generation: {str(e)}")
            raise RuntimeError(f"An unexpected error occurred: {str(e)}")
