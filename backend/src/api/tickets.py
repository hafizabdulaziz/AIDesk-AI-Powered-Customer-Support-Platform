from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4

from api.dependencies import get_db
from models.database import Ticket, TicketStatus
from models.schemas import TicketRead # Assuming TicketRead exists in schemas.py

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_ticket(payload: dict, db: Session = Depends(get_db)):
    """
    Creates a new support ticket.
    Expected payload: { "user_id": str, "title": str, "category": str, "priority": str, "description": str }
    """
    try:
        user_id = payload.get("user_id")
        title = payload.get("title", "New Conversation")
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        new_ticket = Ticket(
            id=str(uuid4()),
            user_id=user_id,
            title=title,
            status=TicketStatus.OPEN
        )
        
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
        
        return {
            "ticket_id": new_ticket.id,
            "title": new_ticket.title,
            "status": new_ticket.status.value,
            "message": "Ticket created successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create ticket: {str(e)}")

@router.get("/", response_model=List[dict])
async def list_all_tickets(db: Session = Depends(get_db)):
    """
    List all tickets in the system (Admin view).
    """
    tickets = db.query(Ticket).all()
    return [{"id": t.id, "title": t.title, "status": t.status.value, "user_id": t.user_id} for t in tickets]
