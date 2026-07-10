import requests
import json
import uuid

API_URL = "http://localhost:8000/api/v1/chat/message"
USER_ID = str(uuid.uuid4())
TICKET_ID = None

test_cases = [
    {"content": "Hello there!", "expected": "Greeting"},
    {"content": "I need help with a return", "expected": "Guidance/Policy"},
    {"content": "I am very frustrated and want to speak with a human agent right now", "expected": "Handoff"},
    {"content": "What is the weather in Tokyo?", "expected": "General knowledge/Polite refusal"},
]

def run_tests():
    global TICKET_ID
    print(f"Starting AI Agent Testing with UUIDs...\n")
    
    for i, test in enumerate(test_cases):
        payload = {
            "user_id": USER_ID,
            "ticket_id": TICKET_ID,
            "content": test["content"]
        }
        
        print(f"Test {i+1}: {test['content']}")
        try:
            response = requests.post(API_URL, json=payload, timeout=30)
            if response.status_code == 201:
                data = response.json()
                TICKET_ID = data.get("ticket_id")
                print(f"Response: {data['response']}")
                print(f"Handoff needed: {data['needs_handoff']}")
                print(f"Ticket Status: {data['status']}")
            else:
                print(f"Error: API returned status {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Exception occurred: {e}")
        print("-" * 30)

if __name__ == "__main__":
    run_tests()
