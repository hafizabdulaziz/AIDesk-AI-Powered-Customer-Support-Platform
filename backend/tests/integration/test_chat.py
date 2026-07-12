import pytest
from fastapi.testclient import TestClient
from api.main import app
from models.database import Base, engine

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_chat_message_flow():
    # Arrange
    payload = {
        "user_id": "test-user-1",
        "content": "How do I reset my password?"
    }
    
    # Act
    response = client.post("/api/v1/chat/message", json=payload)
    
    # Assert
    assert response.status_code == 201
    assert "response" in response.json()
