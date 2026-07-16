# AIDesk: AI-Powered Customer Support Platform

AIDesk is an advanced, production-ready AI Customer Support Platform designed to streamline interactions between customers and support agents using LLMs.

## 🚀 Features
- **Intelligent RAG:** Grounded responses using ChromaDB vector store.
- **Stateful Chat:** Real-time session management using SQLite.
- **Admin Dashboard:** Manage tickets, user support, and configuration.
- **Modern UI:** Tailwind CSS powered, responsive frontend with Vanilla JS.
- **Scalable Backend:** FastAPI structure with clear separation of concerns (Core, API, Services, Models).

## 🛠 Tech Stack
- **Backend:** Python 3.13+, FastAPI, SQLAlchemy, SQLite, ChromaDB.
- **Frontend:** HTML/CSS/JS, Vite (for asset bundling), Tailwind CSS.
- **AI/ML:** LangChain, SentenceTransformers (for embeddings), Ollama/Gemini integration.

## 📂 Project Structure
```text
ai-customer-support-platform/
├── backend/
│   ├── src/
│   │   ├── api/        # API Endpoints (admin, chat, tickets)
│   │   ├── core/       # Configurations
│   │   ├── models/     # Database schemas
│   │   └── services/   # AI Agent, RAG, VectorStore
│   ├── tests/          # Integration and unit tests
│   └── tools/          # System tools & diagnostics
├── frontend/
│   ├── src/            # Frontend assets
│   ├── templates/      # Jinja2/HTML templates
│   └── static/         # Compiled assets
└── specs/              # Technical specifications & ADRs
```

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.13+
- Node.js (for frontend build)
- Ollama (running locally)

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. `python init_db.py`
6. `python src/api/main.py`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run build` (Generates assets for backend)

## 💡 Usage
1. Start Backend: `start_aidesk.bat`
2. Access Dashboard: `http://localhost:8000`

## 📋 ADRs & Documentation
Comprehensive documentation, ADRs, and task lists can be found in the `specs/` directory.

## 🛡️ Security & Privacy
- Secrets managed via `.env` files.
- Audit logs enabled in admin panel.

---
*Developed by Abdul Aziz | Panaversity Agentic AI Course*
