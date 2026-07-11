import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_chat_message_flow():
    # Arrange
    payload = {
        "ticket_id": "test-ticket-123",
        "message": "How do I reset my password?"
    }
    
    # Act
    response = client.post("/api/v1/chat/message", json=payload)
    
    # Assert
    assert response.status_code == 200
    assert "response" in response.json()
