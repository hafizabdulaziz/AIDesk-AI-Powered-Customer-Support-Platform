import logging
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import Tuple, List, Dict, Any
from services.rag_service import RAGService
from core.config import settings

# Setup logger
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.mock_mode = settings.MOCK_MODE
        
        if not self.mock_mode:
            try:
                # Initialize Ollama local model
                self.llm = ChatOllama(model="llama3.2")
                self.system_instruction = (
                    "You are a world-class, professional, and highly empathetic AI Customer Support Specialist."
                )
                logger.info("AI Agent initialized successfully with Ollama (llama3.2)")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama: {str(e)}")
                self.llm = None
        else:
            logger.info("AI Agent running in MOCK_MODE")
            self.llm = None

        self.rag_service = RAGService()

    def generate_response(self, query: str, history: List[Dict[str, str]] = None) -> Tuple[str, bool]:
        if settings.MOCK_MODE:
            if "hello" in query.lower(): return "Hello! How can I help?", False
            return "Simulated response.", False

        if not self.llm:
            return "Service not initialized. Please ensure Ollama is running.", True

        # RAG Context Retrieval
        context_text = "\n".join(self.rag_service.retrieve_documents(query))
        
        messages = [SystemMessage(content=self.system_instruction)]
        for msg in history or []:
            messages.append(HumanMessage(content=msg["content"]) if msg["role"] == "user" else AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=f"Context:\n{context_text}\n\nQuery: {query}"))

        try:
            response = self.llm.invoke(messages)
            answer = response.content
            
            # Simple handoff detection
            needs_handoff = "transfer" in answer.lower()
            return answer, needs_handoff
        except Exception as e:
            logger.exception(f"Ollama call failed: {str(e)}")
            return "Technical Error occurred.", True

# Initialize singleton instance
ai_agent = AIAgent()
