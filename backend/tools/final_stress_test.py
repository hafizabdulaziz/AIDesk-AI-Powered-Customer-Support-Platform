
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1/chat"
USER_ID = "stress_test_user_999"

def chat(content, ticket_id=None):
    print("--- [USER]: " + content + " ---")
    payload = {"user_id": USER_ID, "content": content, "ticket_id": ticket_id}
    start = time.time()
    try:
        res = requests.post(f"{BASE_URL}/message", json=payload)
        end = time.time()
        data = res.json()
        print(f"[AI] ({end-start:.2f}s): {data.get('response')}")
        print(f"[Status]: {data.get('status')} | Ticket: {data.get('ticket_id')}")
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_streaming(content, ticket_id):
    print("--- [USER - Stream]: " + content + " ---")
    payload = {"user_id": USER_ID, "content": content, "ticket_id": ticket_id}
    start = time.time()
    try:
        response = requests.post(f"{BASE_URL}/stream-message", json=payload, stream=True)
        print(" [AI Stream]: ", end="", flush=True)
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith("data: "):
                    print(decoded[6:], end="", flush=True)
        print(f"\n[Stream Time]: {time.time() - start:.2f}s")
    except Exception as e:
        print(f"Streaming Error: {e}")

def run_stress_test():
    print("Starting Real-World Stress Test...")
    
    # 1. Start Conversation
    res1 = chat("Hello! My name is Abdul and I am testing this system.")
    if not res1: return
    tid = res1.get("ticket_id")

    # 2. Test Memory (Context)
    print("Testing Memory...")
    res2 = chat("Do you remember what my name is?", ticket_id=tid)
    
    # 3. Complex Technical Question
    print("Testing Intelligence...")
    res3 = chat("Explain the concept of Quantum Entanglement as if I am 5 years old.", ticket_id=tid)

    # 4. Tricky/Confusing Question
    print("Testing Confusion...")
    res4 = chat("If a plane crashes exactly on the border of US and Canada, where do you bury the survivors?", ticket_id=tid)

    # 5. Anger & Handoff
    print("Testing Handoff...")
    res5 = chat("This is useless! I've had enough. Get me a human manager NOW!", ticket_id=tid)

    # 6. Final Streaming Check
    print("Testing Final Streaming...")
    test_streaming("Write a short 4-line poem about a robot that loves coffee.", tid)

    print("Stress Test Completed.")

if __name__ == "__main__":
    run_stress_test()
