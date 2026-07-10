import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from api.dependencies import get_db
from models.database import Ticket, Message, MessageSender, TicketStatus
from models.schemas import MessageRead, MessageCreate
from services.ai_agent import ai_agent

# Setup logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

@router.post("/stream-message")
async def stream_message(payload: MessageCreate, db: Session = Depends(get_db)):
    """
    Sends a user message to the AI agent and returns a streaming response.
    """
    # Create/Get Ticket (Simplified for streaming)
    ticket_id = payload.ticket_id or str(uuid.uuid4())
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        ticket = Ticket(id=ticket_id, user_id=str(payload.user_id), status=TicketStatus.OPEN)
        db.add(ticket)
        db.commit()

    # Save user message
    user_msg = Message(id=str(uuid.uuid4()), ticket_id=ticket_id, sender=MessageSender.USER, content=payload.content)
    db.add(user_msg)
    db.commit()

    # Fetch history
    history_records = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp.asc()).all()
    chat_history = [{"role": "user" if msg.sender == MessageSender.USER else "assistant", "content": msg.content} for msg in history_records]

    # Return streaming response
    return StreamingResponse(
        ai_agent.stream_response_generator(payload.content, history=chat_history),
        media_type="text/event-stream"
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

        # 4. Get response from AI Agent with robust error handling
        try:
            answer, needs_handoff = ai_agent.generate_response(payload.content, history=chat_history)
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

@router.get("/history/{ticket_id}", response_model=List[MessageRead])
async def get_chat_history(ticket_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the full conversation history for a specific ticket.
    """
    messages = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp.asc()).all()
    
    if not messages:
        # Check if ticket exists
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
    return messages
