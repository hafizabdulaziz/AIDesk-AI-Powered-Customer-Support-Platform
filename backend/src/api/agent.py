from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from models.database import SessionLocal, Ticket, TicketStatus
from models.schemas import TicketRead
from uuid import UUID

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/tickets/pending", response_model=List[TicketRead])
async def get_pending_tickets(db: Session = Depends(get_db)):
    """
    Retrieve all tickets that are pending human agent intervention.
    """
    return db.query(Ticket).filter(Ticket.status == TicketStatus.PENDING_HUMAN).all()

@router.post("/tickets/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """
    Mark a ticket as resolved by a human agent.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = TicketStatus.CLOSED
    db.commit()
    return {"message": f"Ticket {ticket_id} has been marked as resolved."}

@router.get("/tickets/{ticket_id}/history")
async def get_ticket_history(ticket_id: str, db: Session = Depends(get_db)):
    """
    Get full chat history for a specific ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket.messages
