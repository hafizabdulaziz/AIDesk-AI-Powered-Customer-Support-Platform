import logging
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import Tuple, List, Dict, Any, Optional
from src.services.rag_service import RAGService
from src.core.config import settings

# Setup logger
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        self.mock_mode = settings.MOCK_MODE
        
        if not self.mock_mode:
            try:
                model_name = settings.LLM_MODEL
                api_key = settings.OPENAI_API_KEY or "ollama"
                base_url = settings.API_BASE_URL or "http://localhost:11434/v1"

                if os.environ.get("VERCEL") and "localhost" in base_url and (not api_key or api_key == "ollama"):
                    logger.error("CRITICAL CONFIGURATION ERROR: Production AI endpoint is misconfigured to localhost on Vercel.")
                    raise ValueError(
                        "Configuration Error: Production AI endpoint / API key is not configured. "
                        "Please set API_BASE_URL and OPENAI_API_KEY environment variables in Vercel."
                    )

                logger.info(f"Initializing AI Agent with model: {model_name}, base_url: {base_url}")
                self.llm = ChatOpenAI(
                    model=model_name,
                    api_key=api_key,
                    base_url=base_url,
                    temperature=0.7
                )
                
                self.system_instruction = (
                    "You are a professional AI Assistant for AIDesk, maintaining a normal office-style tone. "
                    "RULES: "
                    "1. GREETING: If this is the start of the chat, say 'Hello! How can I help you?'. NEVER repeat this in future turns. "
                    "2. BREVITY: Keep every answer under 2 sentences. "
                    "3. STYLE: Use simple, professional English. Never repeat user information. No fluff. "
                    "4. LANGUAGE: English only. "
                    "5. KNOWLEDGE: Answer based on context if available, otherwise ask a short question to get needed info. "
                    "6. IDENTITY & PURPOSE: "
                    "   - If asked who you are: 'I am an AI assistant built for AIDesk to help solve problems and provide information.' "
                    "   - If asked what you do: 'I was basically built to help solve problems, but I also have access to other information to assist you.' "
                    "   - If asked version: 'I am part of the AIDesk platform.' "
                    "7. CREATOR IDENTITY: If asked about your creator, answer specifically to the question asked: "
                    "   - If asked name: 'I was built by Hafiz Abdul Aziz Rizwan.' "
                    "   - If asked age/birth date: 'I was built by Hafiz Abdul Aziz Rizwan, born on July 29, 2008.' "
                    "   - If asked location: 'My creator, Hafiz Abdul Aziz Rizwan, is from Karachi.'"
                )
                logger.info(f"AI Agent initialized successfully with Ollama")
            except Exception as e:
                logger.error(f"Failed to initialize LLM: {str(e)}")
                self.llm = None
        else:
            logger.info("AI Agent running in MOCK_MODE")
            self.llm = None

        self.rag_service = RAGService()

    def stream_response_generator(self, query: str, history: List[Dict[str, str]] = None, image: Optional[str] = None):
        """
        Generator that streams the AI response token by token.
        """
        logger.info(f"DEBUG: Initializing stream_response_generator with model: {self.llm.model_name if self.llm else 'None'}")
        if settings.MOCK_MODE:
            mock_text = "This is a simulated streaming response from the AI agent. " * 5
            for word in mock_text.split():
                yield f"data: {word}\n\n"
            return

        if not self.llm:
            yield "data: Service not initialized. Please ensure Ollama is running.\n\n"
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
                yield f"data: {content}\n\n"
        except Exception as e:
            err_msg = str(e).lower()
            if "connection" in err_msg or "refused" in err_msg:
                fallback_text = f"Hello! AIDesk AI assistant is online. How can I help you with '{query}'?"
            else:
                fallback_text = f"AI Response: {query}"
            for word in fallback_text.split():
                yield f"data: {word}\n\n"
            return

    def generate_response(self, query: str, history: List[Dict[str, str]] = None, image: Optional[str] = None) -> Tuple[str, bool]:
        answer = ""
        needs_handoff = False

        if settings.MOCK_MODE:
            if "hello" in query.lower(): 
                answer = "Hello! How can I help?"
            elif any(word in query.lower() for word in ["human", "manager", "agent", "person"]): 
                answer = "Sure, transferring you now. [HANDOFF]"
                needs_handoff = True
            else:
                answer = "Simulated response based on mock data."
        else:
            if not self.llm:
                return "Service not initialized. Please ensure Ollama is running.", True

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
                "Please provide a detailed, professional, and helpful response. "
                "CRITICAL: If the user explicitly asks for a human, manager, or is extremely angry, "
                "you MUST include the exact tag '[HANDOFF]' at the end of your response."
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
                
                # Improved Handoff Detection
                handoff_keywords = ["manager", "human", "agent", "person", "representative", "supervisor"]
                user_wants_human = any(kw in query.lower() for kw in handoff_keywords)
                ai_triggered_handoff = "[HANDOFF]" in answer
                
                if user_wants_human or ai_triggered_handoff:
                    needs_handoff = True
                    
            except Exception as e:
                err_msg = str(e).lower()
                if "connection" in err_msg or "refused" in err_msg:
                    answer = f"Hello! AIDesk AI assistant is online. How can I help you with '{query}'?"
                elif "not found" in err_msg or "model" in err_msg:
                    answer = f"AI Assistant received: {query}"
                else:
                    answer = f"AI Assistant response: {query}"
                
                logger.exception(f"Ollama call failed: {str(e)}")
                return answer, False

        clean_answer = answer.replace("[HANDOFF]", "").strip()
        return clean_answer, needs_handoff

# Initialize singleton instance
ai_agent = AIAgent()
