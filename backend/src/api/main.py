from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from src.core.config import settings
from src.models.database import Base, engine
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: (Optional) Clean up resources here

from src.api import chat, admin, agent, tickets, auth

app = FastAPI(
    title=settings.APP_NAME,
    description="AI Customer Support Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(agent.router)
app.include_router(tickets.router)
app.include_router(auth.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

# Robust Path Setup for Frontend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")

if os.path.exists(DIST_DIR):
    # Mount frontend dist at root (serves index.html, assets, JS, CSS with correct MIME types automatically)
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend-dist")
else:
    @app.get("/{rest_of_path:path}")
    async def serve_react_missing(request: Request, rest_of_path: str):
        if rest_of_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        raise HTTPException(
            status_code=500, 
            detail="Frontend build output (dist) not found. Please ensure frontend is built during deployment."
        )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
