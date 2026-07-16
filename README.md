# AIDesk - AI Customer Support Platform

## Overview
AIDesk is a modern, production-ready AI Customer Support Platform built with FastAPI, PostgreSQL/SQLite, ChromaDB, and LangChain. It provides an intelligent, session-based chat experience.

## Tech Stack
- **Backend:** FastAPI, SQLAlchemy, SQLite (for development), Ollama/LangChain.
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript.

## Features
- **Session-based Chat:** Manage multiple chat sessions seamlessly.
- **Intelligent AI Assistant:** Powered by Ollama (llama3.2), tailored for concise support.
- **RAG-enabled:** Grounded responses based on knowledge base documentation.
- **Responsive UI:** Modern, mobile-first design.

## Setup Instructions

### 1. Backend
```bash
cd backend
python -m venv venv
# Activate venv
pip install -r requirements.txt
# Initialize Database
python init_db.py
# Run
python src/api/main.py
```

### 2. Frontend
No build step required; frontend files are served by FastAPI directly from the `frontend/` directory.

## Known Issues
- **Context Handling:** Currently optimized for English. Roman Urdu/Local context handling is a roadmap item.
