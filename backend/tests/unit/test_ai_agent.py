import pytest
from services.ai_agent import AIAgent
from core.config import settings

def test_ai_agent_mock_hello():
    agent = AIAgent()
    response, handoff = agent.generate_response("Hello")
    assert "Hello" in response
    assert handoff is False

def test_ai_agent_mock_handoff():
    agent = AIAgent()
    # "human" keyword triggers mock handoff
    response, handoff = agent.generate_response("I want to speak to a human")
    assert handoff is True
    assert "[HANDOFF]" not in response # Should be cleaned up

def test_ai_agent_mock_default():
    agent = AIAgent()
    response, handoff = agent.generate_response("Random query")
    assert "Simulated response" in response
    assert handoff is False
