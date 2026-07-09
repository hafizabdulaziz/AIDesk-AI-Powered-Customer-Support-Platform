import logging
import os
from google import genai
from google.genai import types

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class EmbeddingService:
    def __init__(self):
        # Configure Gemini with the new client
        self.client = genai.Client(api_key=os.environ.get("OPENAI_API_KEY"))
        # Using the exact available embedding model
        self.model = "text-embedding-004"

    def get_embedding(self, text: str):
        """
        Generates an embedding for the given text using Google's embedding model.
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding.")
            return None

        try:
            # Correct Google SDK call for embedding using the new client
            response = self.client.models.embed_content(
                model=self.model,
                contents=text,
            )
            return response.embeddings[0].values
        except Exception as e:
            logger.error(f"Error during embedding generation: {str(e)}")
            raise RuntimeError(f"An unexpected error occurred: {str(e)}")
