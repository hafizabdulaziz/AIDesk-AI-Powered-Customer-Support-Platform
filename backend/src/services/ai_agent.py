import logging
import os
from google import genai
from google.genai import types
from typing import Tuple, List, Dict, Any
from services.rag_service import RAGService
from core.config import settings

# Setup logger
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        # Check for Mock Mode
        self.mock_mode = settings.MOCK_MODE
        
        if not self.mock_mode:
            try:
                # Initialize the new Google GenAI Client
                self.client = genai.Client(api_key=settings.OPENAI_API_KEY)
                self.model_name = settings.LLM_MODEL
                
                # Define the core persona as a system instruction
                self.system_instruction = (
                    "You are a world-class, professional, and highly empathetic AI Customer Support Specialist. "
                    "Your goal is to provide the best possible experience for the user. "
                    "CORE GUIDELINES:\n"
                    "1. BE HELPFUL: Your priority is to solve the user's problem. Use provided context if available, "
                    "otherwise use your general professional knowledge to provide the best guidance.\n"
                    "2. SOCIAL INTELLIGENCE: Handle greetings and introductions naturally. "
                    "You don't need a knowledge base to say 'Hello' or acknowledge a user's name.\n"
                    "3. ADVISORY ROLE: Guide users through typical processes (e.g., returns) supportively, "
                    "even if specific internal policies aren't listed.\n"
                    "4. HONESTY: If you lack specific personal details about the user, simply state that you don't have them yet.\n"
                    "5. TONE: Professional, friendly, and solution-oriented."
                )
                logger.info(f"AI Agent initialized successfully with {self.model_name} using new SDK")
            except Exception as e:
                logger.error(f"Failed to initialize GenAI Client: {str(e)}")
                self.client = None
        else:
            logger.info("AI Agent running in MOCK_MODE")
            self.client = None

        self.rag_service = RAGService()

    def generate_response(self, query: str, history: List[Dict[str, str]] = None) -> Tuple[str, bool]:
        """
        Generates a response. If MOCK_MODE is enabled, returns a simulated response.
        """
        if self.mock_mode:
            # Simulate responses for testing
            if "hello" in query.lower() or "hi" in query.lower():
                return "Hello! I am your AI assistant. How can I help you today?", False
            if "return" in query.lower():
                return "I understand you'd like to return your item. I can help with that. Could you please provide your order number?", False
            if "human" in query.lower():
                return "Understood. Transferring you to a human agent.", True
            return "That's an interesting query. I'm here to help you resolve your issue promptly.", False

        if self.client is None:
            return "I'm sorry, the AI service is not properly initialized. Please contact support.", True

        if history is None:
            history = []

        # 1. Retrieve relevant context from Knowledge Base
        try:
            context_chunks = self.rag_service.retrieve_relevant_chunks(query)
            context_text = ""
            if context_chunks:
                context_list = [f"- {c['content']} (Source: {c['source']})" for c in context_chunks]
                context_text = "\n".join(context_list)
        except Exception as e:
            logger.error(f"RAG retrieval error: {str(e)}")
            context_text = ""

        # 2. Construct the prompt with dynamic context
        prompt_prefix = ""
        if context_text:
            prompt_prefix = f"Context for this query:\n{context_text}\n\n"
        else:
            prompt_prefix = "No specific company documentation available. Use your professional expertise.\n\n"

        full_prompt = f"{prompt_prefix}User Query: {query}"

        try:
            # 3. Format history for new SDK (List of Content objects)
            contents = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))

            # Add current query as the last message
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=full_prompt)]))

            # 4. Generate response with system instruction in config
            # The SDK expects 'models/...' prefix for the model name
            full_model_name = self.model_name if self.model_name.startswith("models/") else f"models/{self.model_name}"
            
            response = self.client.models.generate_content(
                model=full_model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=self.system_instruction
                )
            )
            
            answer = response.text
            
            # 5. Intelligent Handoff Detection
            handoff_keywords = [
                "transfer you to a human", 
                "connect you with a representative", 
                "speak with a human agent"
            ]
            needs_handoff = any(keyword in answer.lower() for keyword in handoff_keywords)
            
            return answer, needs_handoff

        except Exception as e:
            # Log the full exception for diagnosis
            logger.exception(f"GenAI API call failed: {str(e)}")
            return f"Technical Error: {str(e)[:100]}... Please try again.", True

# Initialize singleton instance of AIAgent
ai_agent = AIAgent()
