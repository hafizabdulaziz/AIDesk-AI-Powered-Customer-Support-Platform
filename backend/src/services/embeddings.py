import subprocess
import json
import logging
import numpy as np
from core.config import settings

# Setup logger
logger = logging.getLogger(__name__)

class PseudoEmbeddingService:
    """
    A zero-dependency, pure-python embedding service that uses deterministic 
    hashing to generate pseudo-embeddings. This allows RAG logic to be 
    tested and verified without heavy dependencies or API calls.
    """
    def __init__(self, dimension: int = 768):
        self.dimension = dimension

    def get_embedding(self, text: str):
        if settings.MOCK_MODE:
            return [0.0] * self.dimension
        
        try:
            # Create a deterministic hash of the text
            import hashlib
            hash_object = hashlib.sha256(text.encode('utf-8'))
            hash_hex = hash_object.hexdigest()
            
            # Convert part of the hash into a float vector
            # We use the hex values to populate the vector to ensure 
            # the same text always produces the same vector.
            vector = []
            for i in range(self.dimension):
                # Take 4 characters of the hash for each dimension
                # Using modulo to keep it within range
                part = hash_hex[i % len(hash_hex) : (i % len(hash_hex)) + 4]
                val = int(part, 16) / 0xFFFF
                vector.append(val)
            
            # Normalize the vector to unit length (crucial for cosine similarity)
            vector_np = np.array(vector)
            norm = np.linalg.norm(vector_np)
            if norm > 0:
                vector_np = vector_np / norm
            
            return vector_np.tolist()
            
        except Exception as e:
            logger.error(f"Pseudo-embedding generation failed: {str(e)}")
            return [0.0] * self.dimension

# Singleton instance
embedding_service = PseudoEmbeddingService()
