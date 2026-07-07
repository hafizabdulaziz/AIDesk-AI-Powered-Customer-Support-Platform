from fastapi import Depends
from sqlalchemy.orm import Session
from models.database import SessionLocal

def get_db():
    """
    Dependency that provides a SQLAlchemy database session for a request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
