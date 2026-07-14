from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from core.config import settings
from models.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: (Optional) Clean up resources here

from api import chat, admin, agent

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

# Mount static files and templates
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(agent.router)

# --- Frontend Routes ---

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("base.html", {"request": request})

@app.get("/chat")
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/dashboard")
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/tickets")
async def tickets_page(request: Request):
    # Reusing chat page for tickets list as per layout
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/ticket/{ticket_id}")
async def ticket_detail_page(request: Request, ticket_id: str):
    return templates.TemplateResponse("ticket_detail.html", {"request": request, "ticket_id": ticket_id})

@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

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
    uvicorn.run(app, host="0.0.0.0", port=8001)

