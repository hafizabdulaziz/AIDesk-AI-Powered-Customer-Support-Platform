import os

# Force mock mode for all tests to ensure reproducible unit and integration tests
os.environ["MOCK_MODE"] = "True"
