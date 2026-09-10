
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from services.ai_agent import ai_agent
from core.config import settings

def start_chat():
    print("--------------------------------------------------")
    print("AI CUSTOMER SUPPORT - TERMINAL MODE")
    print("Type 'exit' to stop")
    print("--------------------------------------------------")
    
    chat_history = []
    
    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() == 'exit':
                break
            if not user_input.strip():
                continue

            response, needs_handoff = ai_agent.generate_response(
                user_input, 
                history=chat_history
            )

            print("AI: " + str(response))
            if needs_handoff:
                print("[SYSTEM]: Handoff triggered!")

            chat_history.append({"role": "user", "content": user_input})
            chat_history.append({"role": "assistant", "content": response})

        except Exception as e:
            print("Error: " + str(e))

if __name__ == "__main__":
    start_chat()
