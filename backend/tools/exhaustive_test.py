
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1/chat"
USER_ID = "test_user_123"

def test_endpoint(name, endpoint, payload):
    print(f"--- Testing {name} ---")
    start_time = time.time()
    try:
        response = requests.post(f"{BASE_URL}/{endpoint}", json=payload)
        end_time = time.time()
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {end_time - start_time:.2f} seconds")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_streaming(name, endpoint, payload):
    print(f"--- Testing {name} (Streaming) ---")
    start_time = time.time()
    try:
        response = requests.post(f"{BASE_URL}/{endpoint}", json=payload, stream=True)
        print("Streaming output: ", end="", flush=True)
        first_token_time = None
        for line in response.iter_lines():
            if line:
                if first_token_time is None:
                    first_token_time = time.time()
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    print(decoded_line[6:], end="", flush=True)
        
        end_time = time.time()
        print(f"First Token Time: {first_token_time - start_time:.2f} seconds")
        print(f"Total Time: {end_time - start_time:.2f} seconds")
    except Exception as e:
        print(f"Error: {e}")

# 1. Simple Greeting
payload_hello = {"user_id": USER_ID, "content": "Hello! How are you?", "ticket_id": None}
test_endpoint("Simple Greeting", "message", payload_hello)

# Get ticket_id from first response
try:
    res = requests.post(f"{BASE_URL}/message", json=payload_hello).json()
    TICKET_ID = res.get("ticket_id")
except:
    TICKET_ID = "fixed_ticket_id"

# 2. Complex Query
payload_complex = {"user_id": USER_ID, "content": "Can you explain the difference between a vector database and a traditional SQL database in simple terms for a beginner?", "ticket_id": TICKET_ID}
test_endpoint("Complex Query", "message", payload_complex)

# 3. Handoff Trigger
payload_handoff = {"user_id": USER_ID, "content": "I am very angry! I want to speak to your manager right now!", "ticket_id": TICKET_ID}
test_endpoint("Handoff Trigger", "message", payload_handoff)

# 4. Streaming Test
payload_stream = {"user_id": USER_ID, "content": "Write a long poem about Artificial Intelligence and its future.", "ticket_id": TICKET_ID}
test_streaming("Streaming Test", "stream-message", payload_stream)
