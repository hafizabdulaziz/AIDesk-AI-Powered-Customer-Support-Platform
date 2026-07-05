from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
import enum
from core.config import settings

# Base class for models
Base = declarative_base()

# Enums
class TicketStatus(enum.Enum):
    OPEN = "OPEN"
    AI_RESOLVED = "AI_RESOLVED"
    PENDING_HUMAN = "PENDING_HUMAN"
    CLOSED = "CLOSED"

class MessageSender(enum.Enum):
    USER = "USER"
    AI = "AI"
    HUMAN_AGENT = "HUMAN_AGENT"

class AdminRole(enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    KB_MANAGER = "KB_MANAGER"

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    tickets = relationship("Ticket", back_populates="user")

class Administrator(Base):
    __tablename__ = "administrators"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    role = Column(SQLEnum(AdminRole), nullable=False)
    documents = relationship("KnowledgeBaseDocument", back_populates="admin")

class KnowledgeBaseDocument(Base):
    __tablename__ = "kb_documents"
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    content_hash = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(String, ForeignKey("administrators.id"))
    status = Column(String, default="ACTIVE") # ACTIVE, DELETED
    admin = relationship("Administrator", back_populates="documents")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="tickets")
    messages = relationship("Message", back_populates="ticket")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    ticket_id = Column(String, ForeignKey("tickets.id"), nullable=False)
    sender = Column(SQLEnum(MessageSender), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    metadata_json = Column(Text, nullable=True) # Store RAG sources, confidence as JSON string
    ticket = relationship("Ticket", back_populates="messages")

# Database Session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
