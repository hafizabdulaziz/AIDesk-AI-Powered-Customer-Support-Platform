import uuid
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from api.dependencies import get_db
from models.database import Ticket, Message, MessageSender, TicketStatus
from models.schemas import MessageRead, MessageCreate
from services.ai_agent import ai_agent
from services.file_processor import file_processor

# Setup logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

@router.get("/list-sessions/{user_id}")
async def list_sessions(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieves all chat sessions for a specific user.
    """
    tickets = db.query(Ticket).filter(Ticket.user_id == user_id).order_by(Ticket.updated_at.desc()).all()
    return [{"id": t.id, "title": t.title, "updated_at": t.updated_at} for t in tickets]

@router.put("/rename-session/{ticket_id}")
async def rename_session(ticket_id: str, new_title: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.title = new_title
    db.commit()
    return {"message": "Session renamed successfully."}

@router.delete("/delete-session/{ticket_id}")
async def delete_session(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return {"message": "Session deleted successfully."}

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a file, processes it, and indexes its content for the AI.
    """
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        file_processor.process_and_index(temp_path, file.filename)
        os.remove(temp_path)
        
        return {"filename": file.filename, "message": "File processed and indexed successfully."}
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process file.")

@router.post("/stream-message")
async def stream_message(payload: MessageCreate, db: Session = Depends(get_db)):
    """
    Sends a user message to the AI agent and returns a streaming response.
    """
    try:
        # Create/Get Ticket (Simplified for streaming)
        ticket_id = payload.ticket_id or str(uuid.uuid4())
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            ticket = Ticket(id=ticket_id, user_id=str(payload.user_id), status=TicketStatus.OPEN)
            db.add(ticket)
            db.commit()

        # Save user message with image support
        user_msg = Message(id=str(uuid.uuid4()), ticket_id=ticket_id, sender=MessageSender.USER, content=payload.content, image=payload.image)
        db.add(user_msg)
        db.commit()

        # Fetch history
        history_records = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp.asc()).all()
        chat_history = [{"role": "user" if msg.sender == MessageSender.USER else "assistant", "content": msg.content} for msg in history_records]

        # Return streaming response with image support
        return StreamingResponse(
            ai_agent.stream_response_generator(payload.content, history=chat_history, image=payload.image),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.exception(f"Unexpected error in /stream-message endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An internal server error occurred while preparing the streaming response."
        )

@router.post("/message", status_code=status.HTTP_201_CREATED)
async def send_message(payload: MessageCreate, db: Session = Depends(get_db)):
    """
    Sends a user message to the AI agent, retrieves a grounded response, 
    and saves the conversation to the database.
    """
    try:
        # 1. Resolve Ticket: Use provided ID or create new if missing/not found
        ticket_id = payload.ticket_id
        ticket = None
        
        if ticket_id:
            ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

        if not ticket:
            # Create a new ticket if no ID was provided OR if the provided ID doesn't exist in DB
            new_ticket = Ticket(
                id=str(uuid.uuid4()),
                user_id=str(payload.user_id),
                status=TicketStatus.OPEN
            )
            db.add(new_ticket)
            db.commit()
            db.refresh(new_ticket)
            ticket = new_ticket
            ticket_id = ticket.id
        
        # 2. Save user message to database
        user_msg = Message(
            id=str(uuid.uuid4()),
            ticket_id=ticket_id,
            sender=MessageSender.USER,
            content=payload.content
        )
        db.add(user_msg)
        db.commit()

        # 3. Fetch chat history for the AI Agent
        history_records = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp.asc()).all()
        
        chat_history = []
        for msg in history_records:
            role = "user" if msg.sender == MessageSender.USER else "assistant"
            chat_history.append({"role": role, "content": msg.content})

        # 4. Get response from AI Agent with robust error handling and image support
        try:
            answer, needs_handoff = ai_agent.generate_response(payload.content, history=chat_history, image=payload.image)
        except Exception as agent_err:
            logger.error(f"AI Agent internal failure: {str(agent_err)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The AI assistant is momentarily unavailable. A human agent has been notified."
            )

        # 5. Save AI response to database
        ai_msg = Message(
            id=str(uuid.uuid4()),
            ticket_id=ticket_id,
            sender=MessageSender.AI,
            content=answer
        )
        db.add(ai_msg)
        db.commit()

        # 6. Update status to PENDING_HUMAN if handoff is needed, 
        # but do NOT block the AI from responding.
        if needs_handoff:
            ticket.status = TicketStatus.PENDING_HUMAN
            db.commit()
            logger.info(f"Ticket {ticket_id} marked as PENDING_HUMAN for agent notification.")

        return {
            "ticket_id": ticket_id,
            "response": answer,
            "needs_handoff": needs_handoff,
            "status": ticket.status.value
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error in /message endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="An internal server error occurred while processing your message."
        )

import requests

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Checks the health of the AI service, specifically the Ollama connection and model availability.
    """
    health_status = {
        "ollama_running": False,
        "model_installed": False,
        "status": "unhealthy",
        "message": ""
    }
    
    try:
        # 1. Check if Ollama is running
        response = requests.get("http://localhost:11434/api/tags", timeout=2)
        if response.status_code == 200:
            health_status["ollama_running"] = True
            models = response.json().get("models", [])
            model_names = [m.get("name") for m in models]
            
            # 2. Check if llama3.2 is in the list
            if any("llama3.2" in name for name in model_names):
                health_status["model_installed"] = True
                health_status["status"] = "healthy"
                health_status["message"] = "AI Engine is ready."
            else:
                health_status["message"] = "Ollama is running, but 'llama3.2' model is missing. Run 'ollama pull llama3.2'."
        else:
            health_status["message"] = "Ollama service is not responding. Please start Ollama."
            
    except requests.exceptions.ConnectionError:
        health_status["message"] = "Ollama is not running. Please start the Ollama application."
    except Exception as e:
        health_status["message"] = f"Health check failed: {str(e)}"
        
    return health_status
