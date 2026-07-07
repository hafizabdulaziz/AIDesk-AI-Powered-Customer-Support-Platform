import pytest
from unittest.mock import MagicMock, patch
from backend.src.services.rag_service import RAGService
from backend.src.services.vector_store import vector_store

@pytest.fixture
def mock_vector_store():
    return MagicMock()

@pytest.fixture
def mock_embedding_service():
    return MagicMock()

@pytest.fixture
def rag_service(mock_vector_store, mock_embedding_service):
    # Patch the singleton vector_store and the EmbeddingService inside RAGService
    with patch('backend.src.services.rag_service.vector_store', mock_vector_store), \
         patch('backend.src.services.rag_service.EmbeddingService', return_value=mock_embedding_service):
        service = RAGService()
        yield service

def test_retrieve_relevant_chunks_returns_results(rag_service, mock_vector_store, mock_embedding_service):
    # Arrange
    query = "What is the return policy?"
    mock_embedding = [0.1, 0.2, 0.3]
    mock_embedding_service.get_embedding.return_value = mock_embedding
    
    mock_vector_store.get_or_create_collection.return_value.query.return_value = {
        "documents": [["Our return policy is 30 days.", "Returns must be in original packaging."]],
        "metadatas": [[{"source": "policy.pdf"}, {"source": "policy.pdf"}]]
    }

    # Act
    results = rag_service.retrieve_relevant_chunks(query)

    # Assert
    assert len(results) == 2
    assert results[0]["content"] == "Our return policy is 30 days."
    assert results[0]["source"] == "policy.pdf"
    mock_embedding_service.get_embedding.assert_called_once_with(query)

def test_retrieve_relevant_chunks_empty_results(rag_service, mock_vector_store, mock_embedding_service):
    # Arrange
    query = "Something random"
    mock_embedding_service.get_embedding.return_value = [0.1, 0.2, 0.3]
    mock_vector_store.get_or_create_collection.return_value.query.return_value = {
        "documents": [[]],
        "metadatas": [[]]
    }

    # Act
    results = rag_service.retrieve_relevant_chunks(query)

    # Assert
    assert len(results) == 0

def test_retrieve_relevant_chunks_missing_metadata(rag_service, mock_vector_store, mock_embedding_service):
    # Arrange
    query = "What is the return policy?"
    mock_embedding_service.get_embedding.return_value = [0.1, 0.2, 0.3]
    mock_vector_store.get_or_create_collection.return_value.query.return_value = {
        "documents": [["Some content"]],
        "metadatas": [[{}]] # Empty metadata
    }

    # Act
    results = rag_service.retrieve_relevant_chunks(query)

    # Assert
    assert len(results) == 1
    assert results[0]["source"] == "unknown"

def test_retrieve_relevant_chunks_embedding_failure(rag_service, mock_vector_store, mock_embedding_service):
    # Arrange
    query = "What is the return policy?"
    mock_embedding_service.get_embedding.side_effect = Exception("API Connection Error")

    # Act
    results = rag_service.retrieve_relevant_chunks(query)

    # Assert
    assert results == []

def test_retrieve_relevant_chunks_none_results(rag_service, mock_vector_store, mock_embedding_service):
    # Arrange
    query = "What is the return policy?"
    mock_embedding_service.get_embedding.return_value = [0.1, 0.2, 0.3]
    # Simulate vector store returning None instead of a dictionary
    mock_vector_store.get_or_create_collection.return_value.query.return_value = None

    # Act
    results = rag_service.retrieve_relevant_chunks(query)

    # Assert
    assert results == []
