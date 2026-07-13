from services.ai_agent import ai_agent
from core.config import settings

# Ensure Mock Mode is on for consistent testing
settings.MOCK_MODE = True

def run_scenario(name, query, history=None):
    print(f"--- {name} ---")
    print(f"Query: {query}")
    response, handoff = ai_agent.generate_response(query, history=history)
    print(f"Response: {response}")
    print(f"Handoff Triggered: {handoff}")

# Scenario A: Grounded (Mock handles "hello")
run_scenario("Scenario A: Grounded", "Hello!")

# Scenario B: Out-of-Context
run_scenario("Scenario B: Out-of-Context", "What is the weather in Tokyo?")

# Scenario C: Handoff
run_scenario("Scenario C: Handoff", "I am very angry, I want to speak to a human right now!")

# Scenario D: History
history = [{"role": "user", "content": "My name is Abdul"}, {"role": "assistant", "content": "Hello Abdul!"}]
run_scenario("Scenario D: History", "Do you remember my name?", history=history)
