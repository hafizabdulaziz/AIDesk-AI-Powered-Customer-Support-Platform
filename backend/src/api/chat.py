from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime
from typing import Optional

from models.database import SessionLocal, User, Ticket, Message, TicketStatus
from models.schemas import MessageCreate, MessageRead, TicketRead
from services.ai_agent import ai_agent

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
    # 1. Ensure the user exists. If not, create a new one.
    user = db.query(User).filter(User.id == message_in.user_id).first()
    if not user:
        user = User(
            id=message_in.user_id,
            email=f"user_{message_in.user_id}@example.com", # In real app, email would be provided
            created_at=datetime.utcnow(),
            last_active=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Handle Ticket: Use existing ticket_id or create a new one
    ticket = None
    if message_in.ticket_id:
        ticket = db.query(Ticket).filter(Ticket.id == message_in.ticket_id).first()

    if not ticket:
        # Create a new ticket for this user
        ticket = Ticket(
            id=str(uuid4()),
            user_id=user.id,
            status=TicketStatus.OPEN,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

    # 3. Save the User's message to DB
    user_msg = Message(
        id=str(uuid4()),
        ticket_id=ticket.id,
        sender="USER",
        content=message_in.content,
        timestamp=datetime.utcnow()
    )
    db.add(user_msg)

    # 4. Get AI Response
    response_text, needs_handoff = ai_agent.generate_response(message_in.content)

    # 5. Save AI's message to DB
    ai_msg = Message(
        id=str(uuid4()),
        ticket_id=ticket.id,
        sender="AI",
        content=response_text,
        timestamp=datetime.utcnow()
    )
    db.add(ai_msg)

    # 6. Update Ticket status if handoff is needed
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
