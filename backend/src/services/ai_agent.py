from typing import Tuple, List, Dict
from openai import OpenAI
from core.config import settings
from services.rag_service import RAGService

class AIAgent:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.LLM_MODEL
        self.rag_service = RAGService()

    def generate_response(self, query: str) -> Tuple[str, bool]:
        """
        Generates a grounded response based on the knowledge base.
        Returns a tuple of (response_text, needs_handoff).
        """
        # 1. Retrieve relevant context from Knowledge Base
        context_chunks = self.rag_service.retrieve_relevant_chunks(query)
        
        if not context_chunks:
            return "I'm sorry, I couldn't find any information regarding your query in my knowledge base. Would you like to speak with a human agent?", True

        # 2. Construct the System Prompt for Grounding
        context_text = "\n".join([f"- {c['content']} (Source: {c['source']})" for c in context_chunks])
        
        system_prompt = """
You are a helpful and professional AI Customer Support Agent.
Your goal is to provide accurate answers based ONLY on the provided context.
If the answer is not contained within the context, politely inform the user
that you don't know and suggest escalating to a human agent.
Do not make up information. Be concise and friendly.

Context:
{context_text}
""".format(context_text=context_text)

        try:
            # 3. Call the LLM
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0
            )
            
            answer = response.choices[0].message.content
            
            # 4. Simple Handoff Detection
            # If the AI admits it doesn't know, trigger handoff
            handoff_keywords = ["don't know", "cannot find", "not in my knowledge base", "speak with a human"]
            needs_handoff = any(keyword in answer.lower() for keyword in handoff_keywords)
            
            return answer, needs_handoff

        except Exception as e:
            print(f"Error calling LLM: {e}")
            return "I'm experiencing some technical difficulties. Please try again later or contact support.", True

# Singleton instance
ai_agent = AIAgent()
