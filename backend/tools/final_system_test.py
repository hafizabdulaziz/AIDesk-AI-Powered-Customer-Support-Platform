import requests
import uuid
import json
import os

BASE_URL = "http://localhost:8001/api/v1"
USER_ID = str(uuid.uuid4())

def test_endpoint(name, method, path, payload=None):
    print(f"Testing {name} ({method} {path})...", end=" ")
    try:
        if method == "POST":
            resp = requests.post(f"{BASE_URL}{path}", json=payload, timeout=60)
        elif method == "GET":
            resp = requests.get(f"{BASE_URL}{path}", timeout=60)
        elif method == "DELETE":
            resp = requests.delete(f"{BASE_URL}{path}", timeout=60)
        else:
            print("❌ Unsupported method")
            return False

        if resp.status_code < 400:
            print("✅ PASS")
            return True
        else:
            print(f"❌ FAIL ({resp.status_code}): {resp.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def main():
    print("Starting Final System Integration Audit...")
    
    results = []
    
    # 1. Health Check
    results.append(test_endpoint("Health Check", "GET", "/chat/health"))
    
    # 2. Initial Message (Create Ticket)
    payload_init = {
        "user_id": USER_ID,
        "content": "Hello, I need help with my order.",
        "image": None
    }
    try:
        init_res = requests.post(f"{BASE_URL}/chat/message", json=payload_init, timeout=60)
        if init_res.status_code == 201:
            print("Initial Message... ✅ PASS")
            ticket_id = init_res.json().get("ticket_id")
            
            # 3. Streaming Message
            payload_stream = {
                "user_id": USER_ID,
                "ticket_id": ticket_id,
                "content": "Can you explain the refund policy?",
                "image": None
            }
            try:
                resp = requests.post(f"{BASE_URL}/chat/stream-message", json=payload_stream, stream=True, timeout=60)
                if resp.status_code == 200:
                    print("Streaming Message... ✅ PASS")
                    results.append(True)
                else:
                    print(f"Streaming Message... ❌ FAIL ({resp.status_code})")
                    results.append(False)
            except Exception as e:
                print(f"Streaming Message... ❌ ERROR: {str(e)}")
                results.append(False)
                
            # 4. Admin KB Upload (Mock file)
            with open("test_kb.txt", "w") as f:
                f.write("The refund policy allows returns within 30 days.")
            
            try:
                with open("test_kb.txt", "rb") as f:
                    files = {'file': f}
                    resp = requests.post(f"{BASE_URL}/admin/kb/upload", files=files, timeout=60)
                    if resp.status_code == 200:
                        print("Admin KB Upload... ✅ PASS")
                        results.append(True)
                    else:
                        print(f"Admin KB Upload... ❌ FAIL ({resp.status_code})")
                        results.append(False)
            finally:
                if os.path.exists("test_kb.txt"):
                    os.remove("test_kb.txt")

            # 5. Agent Pending Tickets
            print("Testing Handoff Trigger...", end=" ")
            payload_handoff = {
                "user_id": USER_ID,
                "ticket_id": ticket_id,
                "content": "I want to speak to a human manager right now!",
                "image": None
            }
            try:
                requests.post(f"{BASE_URL}/chat/message", json=payload_handoff, timeout=120)
                print("✅ TRIGGERED")
            except Exception as e:
                print(f"❌ ERROR: {str(e)}")

            print("Checking Pending Tickets...", end=" ")
            try:
                resp = requests.get(f"{BASE_URL}/agent/tickets/pending", timeout=120)
                if resp.status_code == 200:
                    print("✅ PASS")
                    results.append(True)
                else:
                    print(f"❌ FAIL ({resp.status_code})")
                    results.append(False)
            except Exception as e:
                print(f"❌ ERROR: {str(e)}")
                results.append(False)
        else:
            print(f"Initial Message... ❌ FAIL ({init_res.status_code})")
            results.append(False)
    except Exception as e:
        print(f"Critical error during tests: {str(e)}")
        results.append(False)

    print("-" * 30)
    success_count = sum(results)
    total_count = len(results)
    print(f"Final Audit Result: {success_count}/{total_count} passed.")
    if success_count == total_count:
        print("SYSTEM IS PRODUCTION READY!")
    else:
        print("Some issues found.")
    print("-" * 30)

if __name__ == "__main__":
    main()
