import logging
from langchain_openai import ChatOpenAI
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
                # Initialize ChatOpenAI using Gemini's compatible API
                self.llm = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    openai_api_base=settings.API_BASE_URL,
                    model=settings.LLM_MODEL,
                    temperature=0.3
                )
                self.system_instruction = (
                    "You are a world-class, professional, and highly empathetic AI Customer Support Specialist. "
                    "Your goal is to help users resolve their issues efficiently and kindly.\n\n"
                    "GROUNDING RULES:\n"
                    "1. Use ONLY the provided 'Context' to answer the user's query.\n"
                    "2. If the Context does not contain enough information to answer the query, "
                    "politely state that you don't have that information and offer to transfer them to a human agent.\n"
                    "3. Do NOT make up facts or use outside knowledge.\n"
                    "4. If the user expresses extreme frustration or explicitly asks for a human, "
                    "include the word '[HANDOFF]' in your response to trigger a transfer."
                )
                logger.info(f"AI Agent initialized successfully with Gemini ({settings.LLM_MODEL})")
            except Exception as e:
                logger.error(f"Failed to initialize ChatOpenAI: {str(e)}")
                self.llm = None
        else:
            logger.info("AI Agent running in MOCK_MODE")
            self.llm = None

        self.rag_service = RAGService()

    def stream_response_generator(self, query: str, history: List[Dict[str, str]] = None):
        """
        Generator that streams the AI response token by token.
        """
        if settings.MOCK_MODE:
            mock_text = "This is a simulated streaming response from the AI agent. " * 5
            for word in mock_text.split():
                yield f"data: {word} \n\n"
            return

        if not self.llm:
            yield "data: Service not initialized. \n\n"
            return

        # RAG Context Retrieval
        retrieved_docs = self.rag_service.retrieve_documents(query)
        context_text = "\n".join(retrieved_docs) if retrieved_docs else "No relevant information found."
        
        messages = [SystemMessage(content=self.system_instruction)]
        for msg in history or []:
            messages.append(HumanMessage(content=msg["content"]) if msg["role"] == "user" else AIMessage(content=msg["content"]))
        
        prompt = f"Context:\n{context_text}\n\nQuery: {query}"
        messages.append(HumanMessage(content=prompt))

        try:
            # Use stream=True in invoke or use the .stream() method of the LLM
            for chunk in self.llm.stream(messages):
                content = chunk.content if hasattr(chunk, 'content') else str(chunk)
                yield f"data: {content} \n\n"
        except Exception as e:
            logger.exception(f"Streaming failed: {str(e)}")
            yield f"data: Error occurred during streaming: {str(e)} \n\n"

    def generate_response(self, query: str, history: List[Dict[str, str]] = None) -> Tuple[str, bool]:
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
                return "Service not initialized. Please ensure LLM settings are correct.", True

            # RAG Context Retrieval
            retrieved_docs = self.rag_service.retrieve_documents(query)
            context_text = "\n".join(retrieved_docs) if retrieved_docs else "No relevant information found in knowledge base."
            
            messages = [SystemMessage(content=self.system_instruction)]
            
            for msg in history or []:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                else:
                    messages.append(AIMessage(content=msg["content"]))
            
            prompt = (
                f"Context from Knowledge Base:\n{context_text}\n\n"
                f"User Query: {query}\n\n"
                "Assistant Response:"
            )
            messages.append(HumanMessage(content=prompt))

            try:
                response = self.llm.invoke(messages)
                answer = response.content
                # Detect handoff from LLM output
                if "[HANDOFF]" in answer or "don't have that information" in answer.lower():
                    needs_handoff = True
            except Exception as e:
                logger.exception(f"LLM call failed: {str(e)}")
                return "I apologize, but I'm having trouble connecting to my brain right now. Please try again later.", True

        # Common cleanup logic
        clean_answer = answer.replace("[HANDOFF]", "").strip()
        return clean_answer, needs_handoff

# Initialize singleton instance
ai_agent = AIAgent()

