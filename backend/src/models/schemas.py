from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from .models.database import TicketStatus, MessageSender

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: UUID
    created_at: datetime
    last_active: datetime

class TicketBase(BaseModel):
    user_id: UUID

class TicketCreate(TicketBase):
    pass

class TicketRead(TicketBase):
    id: UUID
    status: TicketStatus
    created_at: datetime
    updated_at: datetime

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    ticket_id: UUID
    sender: MessageSender

class MessageRead(MessageBase):
    id: UUID
    ticket_id: UUID
    sender: MessageSender
    timestamp: datetime
    metadata: Optional[str] = None

class KnowledgeBaseDocCreate(BaseModel):
    filename: str
    admin_id: UUID

class KnowledgeBaseDocRead(BaseModel):
    id: UUID
    filename: str
    upload_date: datetime
    status: str
