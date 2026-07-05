from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime
from typing import Optional

from ..models.database import SessionLocal, User, Ticket, Message, TicketStatus
from ..models.schemas import MessageCreate, MessageRead, TicketRead
from ..services.ai_agent import ai_agent

router = APIRouter(prefix="/chat", tags=["Chat"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/message")
async def send_message(message_in: MessageCreate, db: Session = Depends(get_db)):
    # 1. Ensure the user exists (for MVP, we auto-create the user if not found)
    # Note: In a real app, we'd use auth tokens
    user = db.query(User).filter(User.id == message_in.ticket_id).first() # This is a placeholder; usually we'd have a user_id in the request
    
    # For simplicity in MVP: Let's assume ticket_id is provided and valid
    ticket = db.query(Ticket).filter(Ticket.id == message_in.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 2. Save the User's message to DB
    user_msg = Message(
        id=str(uuid4()),
        ticket_id=ticket.id,
        sender="USER",
        content=message_in.content,
        timestamp=datetime.utcnow()
    )
    db.add(user_msg)

    # 3. Get AI Response
    response_text, needs_handoff = ai_agent.generate_response(message_in.content)

    # 4. Save AI's message to DB
    ai_msg = Message(
        id=str(uuid4()),
        ticket_id=ticket.id,
        sender="AI",
        content=response_text,
        timestamp=datetime.utcnow()
    )
    db.add(ai_msg)

    # 5. Update Ticket status if handoff is needed
    if needs_handoff:
        ticket.status = TicketStatus.PENDING_HUMAN
        ticket.updated_at = datetime.utcnow()

    db.commit()

    return {
        "ticket_id": ticket.id,
        "response": response_text,
        "status": ticket.status.value,
        "needs_handoff": needs_handoff
    }

@router.get("/history/{ticket_id}", response_model=list[MessageRead])
async def get_chat_history(ticket_id: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.ticket_id == ticket_id).order_by(Message.timestamp).all()
    return messages
