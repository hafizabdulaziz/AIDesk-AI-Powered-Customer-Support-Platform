# AIDesk - AI Customer Support Platform

AIDesk is a production-ready AI-powered customer support platform that integrates a FastAPI backend with a modern, responsive frontend. It leverages RAG (Retrieval-Augmented Generation) and Multi-Agent AI to provide high-quality automated support.

## 🚀 Features

- **Modern Chat Interface**: ChatGPT-style UI for seamless user interaction.
- **Ticket Management**: Create, track, and manage support tickets.
- **Admin Dashboard**: Real-time analytics and system overview.
- **RAG Integration**: AI agents grounded in a custom knowledge base.
- **Multi-Agent System**: Automatic handoff from AI to human agents when needed.

## 🛠 Tech Stack

- **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla), Jinja2 Templates.
- **Backend**: FastAPI (Python), PostgreSQL, ChromaDB.
- **AI Engine**: Gemini API / Ollama (Llama 3.2).

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd ai-customer-support-platform
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with your GEMINI_API_KEY and DATABASE_URL
```

### 3. Run the Application
```bash
python src/api/main.py
```
The application will be available at `http://localhost:8001`.

## 📂 Project Structure

- `backend/`: Core API logic, database models, and AI services.
- `frontend/`: Static assets and Jinja2 templates for the web interface.
- `specs/`: Architectural specifications and design documents.

## 🛡 API Endpoints

- `GET /api/v1/chat/list-sessions/{user_id}`: List all tickets for a user.
- `POST /api/v1/chat/message`: Send a message to the AI.
- `GET /api/v1/agent/tickets/{ticket_id}/history`: Get conversation history.
- `GET /api/v1/admin/kb/documents`: List knowledge base documents.
- `POST /api/v1/admin/kb/upload`: Upload new KB documents.
