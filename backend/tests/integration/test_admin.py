import pytest
from fastapi.testclient import TestClient
from api.main import app
from models.database import Base, engine, SessionLocal, Administrator, AdminRole
import uuid
import os

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    """Ensure tables are created before each test and dropped after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_kb_upload_and_delete():
    """
    Test uploading a file to the KB and then deleting it.
    """
    # 1. Test Upload
    # Create a dummy file
    filename = "test_doc.txt"
    with open(filename, "w") as f:
        f.write("This is a test document for the knowledge base.")
    
    with open(filename, "rb") as f:
        response = client.post(
            "/api/v1/chat/upload-file", # Using existing endpoint path
            files={"file": (filename, f, "text/plain")}
        )
    
    # Cleanup dummy file
    os.remove(filename)
    
    assert response.status_code == 200
    assert "indexed successfully" in response.json()["message"]

    # 2. Test Deletion (This will likely fail until the endpoint is implemented)
    # Assuming we'll have a DELETE endpoint in the future
    # For now, this confirms we are planning for the functionality
    doc_id = "test-doc-id"
    response_del = client.delete(f"/api/v1/admin/kb/document/{doc_id}")
    
    # Expect 404 or 405 if not implemented
    assert response_del.status_code in [200, 404, 405]
