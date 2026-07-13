from services.ai_agent import ai_agent
from core.config import settings

def run_test(name, query, history=None):
    print(f" {'='*20} {name} {'='*20} ")
    print(f"User: {query}")
    response, handoff = ai_agent.generate_response(query, history=history)
    print(f"AI Response:\n{response}")
    print(f"Handoff Triggered: {handoff}")
    print(f"{'='*50}\n")

# Test 1: Complex Technical Issue (General Knowledge + Helpfulness)
run_test("Complex Tech Issue", "My laptop is suddenly showing a blue screen and restarting every 5 minutes. I have important work. Please help me fix this step-by-step!")

# Test 2: Extreme Frustration (Handoff Test)
run_test("Frustration/Handoff", "This is ridiculous! I've been waiting for two hours and nobody is helping me. I want to speak to your manager right now!")

# Test 3: Ambiguous Query (Clarification Test)
run_test("Ambiguous Query", "It just stopped working.")

# Test 4: Knowledge Base Gap (Grounding Test)
run_test("KB Gap", "How do I integrate your software with a quantum computer from the year 2050?")
