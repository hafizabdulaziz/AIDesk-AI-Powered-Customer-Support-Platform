# AIDesk: Professional AI-Powered Customer Support Platform

[![Agentic AI](https://img.shields.io/badge/Course-Agentic%20AI-blue)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-green)]()
[![Frontend](https://img.shields.io/badge/Frontend-TailwindCSS-orange)]()

---

## 📖 Overview
**AIDesk** is a high-performance, production-ready AI Customer Support platform. It is engineered to bridge the gap between complex user queries and automated, grounded support. Using the latest **Agentic AI** principles, AIDesk delivers context-aware, stateful, and secure customer support.

## 🌟 Key Features
- **Context-Aware RAG:** Uses ChromaDB and SentenceTransformers to provide accurate, documentation-based answers.
- **Stateful Conversational Engine:** Built-in session management using SQLite to track user journeys.
- **Admin Command Center:** A specialized dashboard to manage tickets, analyze support performance, and monitor agent status.
- **Modern, Reactive UI:** A mobile-first interface designed with Tailwind CSS, ensuring smooth customer interaction.
- **Modular Backend Architecture:** A clean, scalable FastAPI implementation optimized for low-latency AI inference.

## 🛠 Tech Stack
| Tier | Technology |
| :--- | :--- |
| **Backend** | Python 3.13+, FastAPI, SQLAlchemy |
| **Frontend** | Vanilla JS, Tailwind CSS, Vite |
| **AI/ML** | LangChain, ChromaDB, SentenceTransformers |
| **Database** | SQLite (Production-ready with SQLAlchemy ORM) |

## 📂 Architecture
```text
ai-customer-support-platform/
├── backend/
│   ├── src/
│   │   ├── api/        # RESTful API endpoints for Auth, Chat, Tickets
│   │   ├── core/       # Global configuration & security middleware
│   │   ├── models/     # Database schemas & ORM entities
│   │   └── services/   # The AI Agent, RAG engine, and VectorStore logic
│   ├── tests/          # Comprehensive Integration/Unit tests
│   └── tools/          # System diagnostics & stress testing
├── frontend/
│   ├── src/            # Source TypeScript/JS/CSS assets
│   ├── templates/      # Jinja2 templates for Admin/Chat UI
│   └── static/         # Compiled production assets
└── specs/              # ADRs, Research, and Technical Documentation
```

## ⚙️ Deployment & Setup
### 1. Prerequisites
- Python 3.13+ installed.
- Node.js installed for frontend build.
- [Ollama](https://ollama.ai/) running locally for embeddings/inference.

### 2. Backend Initialization
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py  # Initialize DB
python src/api/main.py
```

### 3. Frontend Compilation
```bash
cd frontend
npm install
npm run build
```

## 📈 Roadmap & Future Scope
- [ ] Integration with GPT-4 / Claude API.
- [ ] Real-time WebSocket-based chat.
- [ ] Advanced User Analytics & Reporting.

---
*Built with passion by Abdul Aziz.*
