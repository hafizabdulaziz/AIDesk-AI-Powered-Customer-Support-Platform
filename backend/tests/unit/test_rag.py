import pytest
from services.rag_service import RAGService

# Assuming we have a mock or real RAGService
def test_rag_retrieval():
    # Arrange
    query = "How do I reset my password?"
    rag_service = RAGService()
    
    # Act
    results = rag_service.retrieve_documents(query)
    
    # Assert
    assert results is not None
    assert len(results) > 0
