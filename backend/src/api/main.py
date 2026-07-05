from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from core.config import settings
from models.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: (Optional) Clean up resources here

from api import chat

app = FastAPI(
    title=settings.APP_NAME,
    description="AI Customer Support Platform API",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(chat.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception here in a real app
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
