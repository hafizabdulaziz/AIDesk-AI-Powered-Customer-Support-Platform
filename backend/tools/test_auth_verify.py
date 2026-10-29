import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_auth():
    # Test Signup
    signup_data = {
        "email": "test_verification@example.com",
        "password": "password123",
        "name": "Test User"
    }
    print("Testing Signup...")
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Signup error: {e}")

    # Test Login
    login_data = {
        "email": "test_verification@example.com",
        "password": "password123"
    }
    print("\nTesting Login...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_auth()
