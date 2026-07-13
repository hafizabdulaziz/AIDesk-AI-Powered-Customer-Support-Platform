import json
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator
from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID
from models.database import TicketStatus, MessageSender

# Define a shared configuration that enables serialization of ORM objects
class BaseConfigModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseConfigModel):
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: UUID
    created_at: datetime
    last_active: datetime

class TicketBase(BaseConfigModel):
    user_id: UUID

class TicketCreate(TicketBase):
    pass

class TicketRead(TicketBase):
    id: UUID
    status: TicketStatus
    created_at: datetime
    updated_at: datetime

class MessageBase(BaseConfigModel):
    content: str

class MessageCreate(BaseModel):
    content: str
    user_id: str
    ticket_id: Optional[str] = None
    image: Optional[str] = None

class MessageRead(MessageBase):
    id: UUID
    ticket_id: UUID
    sender: MessageSender
    timestamp: datetime
    metadata: Optional[Any] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_metadata_collision(cls, data: Any) -> Any:
        """
        Bypasses the collision between SQLAlchemy model's .metadata attribute
        (which returns MetaData) and our Pydantic schema's metadata field,
        and parses metadata_json if present.
        """
        if not isinstance(data, dict):
            # If the input is a SQLAlchemy ORM model instance
            metadata_json = getattr(data, "metadata_json", None)
            parsed_metadata = None
            if metadata_json:
                try:
                    parsed_metadata = json.loads(metadata_json)
                except Exception:
                    pass
            
            # Map attributes to a plain dictionary to avoid Pydantic trying to serialize
            # the SQLAlchemy MetaData instance at `.metadata`.
            # We convert UUIDs and Enum values to standard string/Enum types if needed.
            # But returning a dict is extremely robust as Pydantic will validate types correctly.
            return {
                "id": getattr(data, "id"),
                "ticket_id": getattr(data, "ticket_id"),
                "sender": getattr(data, "sender"),
                "content": getattr(data, "content"),
                "timestamp": getattr(data, "timestamp"),
                "metadata": parsed_metadata
            }
        return data

class KnowledgeBaseDocCreate(BaseConfigModel):
    filename: str
    admin_id: UUID

class KnowledgeBaseDocRead(BaseConfigModel):
    id: UUID
    filename: str
    upload_date: datetime
    status: str
