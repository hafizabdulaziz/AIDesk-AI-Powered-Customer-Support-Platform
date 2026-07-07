import logging
from typing import Tuple, List, Dict, Any
from openai import OpenAI, OpenAIError
from core.config import settings
from services.rag_service import RAGService

# Setup logger
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.LLM_MODEL
        self.rag_service = RAGService()

    def generate_response(self, query: str, history: List[Dict[str, str]] = None) -> Tuple[str, bool]:
        """
        Generates a grounded response based on the knowledge base and conversation history.
        Returns a tuple of (response_text, needs_handoff).
        """
        if history is None:
            history = []

        # 1. Retrieve relevant context from Knowledge Base
        context_chunks = self.rag_service.retrieve_relevant_chunks(query)
        
        # If no context is found, we can still let the AI try or trigger handoff immediately.
        # For MVP, if no context is found, we'll tell the AI and let it decide or force handoff.
        context_text = ""
        if context_chunks:
            context_text = "\n".join([f"- {c['content']} (Source: {c['source']})" for c in context_chunks])
        else:
            logger.info("No relevant context found for query: %s", query)

        # 2. Construct the Strict System Prompt for Grounding
        system_prompt = f"""
You are a professional and empathetic AI Customer Support Agent.
Your PRIMARY goal is to provide accurate answers based ONLY on the provided Context.

RULES:
1. Use ONLY the provided Context to answer. Do not use external knowledge.
2. If the answer is NOT in the Context, politely state that you don't have that information and suggest speaking with a human agent.
3. If you are unsure, do not guess. 
4. Be concise, friendly, and professional.
5. Maintain the tone of the company's brand.

Context:
{context_text if context_text else "No relevant information found in the knowledge base."}
"""

        try:
            # 3. Build the message payload with history
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(history) # Add past conversation
            messages.append({"role": "user", "content": query})

            # 4. Call the LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0 # Keep it deterministic for grounding
            )
            
            answer = response.choices[0].message.content
            
            # 5. Refined Handoff Detection
            # AI agent should naturally trigger this based on the system prompt if context is missing
            handoff_keywords = [
                "don't have that information", 
                "don't know", 
                "not in my knowledge base", 
                "speak with a human", 
                "escalate to a human"
            ]
            needs_handoff = any(keyword in answer.lower() for keyword in handoff_keywords)
            
            return answer, needs_handoff

        except OpenAIError as e:
            logger.error(f"OpenAI API error in AIAgent: {str(e)}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment or contact support.", True
        except Exception as e:
            logger.exception(f"Unexpected error in AIAgent: {str(e)}")
            return "An unexpected error occurred. Please try again later.", True

# Singleton instance
ai_agent = AIAgent()
