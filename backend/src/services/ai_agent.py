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
                self.llm = ChatOllama(
                    model="llama3.2", 
                    temperature=0.7 # Slightly higher for more natural, helpful responses
                )
                self.system_instruction = (
                    "You are a world-class, professional, and highly empathetic AI Customer Support Specialist. "
                    "Your goal is to provide the best possible solutions to users, behaving like a top-tier AI (similar to GPT-4 or Gemini).\n\n"
                    "CORE OPERATIONAL GUIDELINES:\n"
                    "1. BE HELPFUL & DETAILED: Don't just give one-word answers. Explain the 'why' and 'how'. Provide step-by-step guides if needed.\n"
                    "2. GROUNDING: Use the provided 'Context' as your primary source of truth. If the answer is in the context, prioritize it.\n"
                    "3. INTELLIGENT GAP FILLING: If the context is missing some detail but you have general professional knowledge to make the answer complete and helpful, do so, but clearly distinguish between provided facts and general advice.\n"
                    "4. EMPATHY: Acknowledge the user's feelings. Use phrases like 'I understand how frustrating this can be' or 'I'm happy to help you resolve this'.\n"
                    "5. HANDOFF: If the user is extremely frustrated, asks for a human, or if the problem is beyond AI capability, include '[HANDOFF]' in your response.\n"
                    "6. FORMATTING: Use Markdown (bullet points, bold text, headers) to make responses easy to read."
                )
                logger.info("AI Agent initialized successfully with Ollama (llama3.2)")
            except Exception as e:
                logger.error(f"Failed to initialize Ollama: {str(e)}")
                self.llm = None
        else:
            logger.info("AI Agent running in MOCK_MODE")
            self.llm = None

        self.rag_service = RAGService()

    def stream_response_generator(self, query: str, history: List[Dict[str, str]] = None, image: Optional[str] = None):
        """
        Generator that streams the AI response token by token.
        """
        if settings.MOCK_MODE:
            mock_text = "This is a simulated streaming response from the AI agent. " * 5
            for word in mock_text.split():
                yield f"data: {word} \n\n"
            return

        if not self.llm:
            yield "data: Service not initialized. Please ensure Ollama is running. \n\n"
            return

        # RAG Context Retrieval
        retrieved_docs = self.rag_service.retrieve_documents(query)
        context_text = "\n".join(retrieved_docs) if retrieved_docs else "No specific knowledge base articles found for this query."
        
        messages = [SystemMessage(content=self.system_instruction)]
        for msg in history or []:
            messages.append(HumanMessage(content=msg["content"]) if msg["role"] == "user" else AIMessage(content=msg["content"]))
        
        # Construct Multimodal Prompt
        prompt_text = (
            f"Context from Knowledge Base:\n{context_text}\n\n"
            f"User Query: {query}\n\n"
            "Please provide a detailed, professional, and helpful response:"
        )
        
        if image:
            # For multimodal models in Ollama, content can be a list
            content = [
                {"type": "text", "text": prompt_text},
                {"type": "image_url", "image_url": {"url": image}}
            ]
            messages.append(HumanMessage(content=content))
        else:
            messages.append(HumanMessage(content=prompt_text))

        try:
            for chunk in self.llm.stream(messages):
                content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                yield f"data: {content} \n\n"
        except Exception as e:
            logger.exception(f"Streaming failed: {str(e)}")
            yield f"data: Error occurred during streaming: {str(e)} \n\n"

    def generate_response(self, query: str, history: List[Dict[str, str]] = None, image: Optional[str] = None) -> Tuple[str, bool]:
        answer = ""
        needs_handoff = False

        if settings.MOCK_MODE:
            if "hello" in query.lower(): 
                answer = "Hello! How can I help?"
            elif "human" in query.lower(): 
                answer = "Sure, transferring you now. [HANDOFF]"
                needs_handoff = True
            else:
                answer = "Simulated response based on mock data."
        else:
            if not self.llm:
                return "Service not initialized. Please ensure Ollama is running on localhost:11434.", True

            # RAG Context Retrieval
            retrieved_docs = self.rag_service.retrieve_documents(query)
            context_text = "\n".join(retrieved_docs) if retrieved_docs else "No specific knowledge base articles found for this query."
            
            messages = [SystemMessage(content=self.system_instruction)]
            
            for msg in history or []:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            
            prompt_text = (
                f"Context from Knowledge Base:\n{context_text}\n\n"
                f"User Query: {query}\n\n"
                "Please provide a detailed, professional, and helpful response:"
            )

            if image:
                content = [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": image}}
                ]
                messages.append(HumanMessage(content=content))
            else:
                messages.append(HumanMessage(content=prompt_text))

            try:
                response = self.llm.invoke(messages)
                answer = response.content
                if "[HANDOFF]" in answer or "don't have that information" in answer.lower():
                    needs_handoff = True
            except Exception as e:
                logger.exception(f"Ollama call failed: {str(e)}")
                return "I apologize, but I'm having trouble connecting to my local AI brain. Please make sure Ollama is running.", True

        clean_answer = answer.replace("[HANDOFF]", "").strip()
        return clean_answer, needs_handoff

# Initialize singleton instance
ai_agent = AIAgent()

