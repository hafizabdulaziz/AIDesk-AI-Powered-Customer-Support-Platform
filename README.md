# AIDesk: AI-Powered Customer Support Platform

[![Course: Agentic AI](https://img.shields.io/badge/Course-Agentic%20AI-blue)](#)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)](#)
[![Frontend: TailwindCSS](https://img.shields.io/badge/Frontend-TailwindCSS-orange)](#)

An AI-driven customer support platform engineered to resolve customer inquiries through retrieval-grounded conversation and administrative ticketing workflows.

## Overview

AIDesk combines a FastAPI backend with a retrieval-augmented generation (RAG) pipeline and a responsive frontend interface. Built around agentic AI design principles, it delivers context-aware, stateful dialogue grounded in documentation, paired with administrative oversight tools for ticket management.

## Key Features

- **Context-Aware Retrieval (RAG)**: Integrates ChromaDB and SentenceTransformers to retrieve domain documentation and produce grounded, factual support responses.
- **Stateful Conversation Engine**: Maintains conversational context across multi-turn exchanges via SQLite session persistence.
- **Admin Management Dashboard**: Provides administrative views to monitor ticket lifecycles, inspect support interactions, and track agent status.
- **Responsive User Interface**: Mobile-friendly, reactive interface built with Tailwind CSS and Vite.
- **Modular Service Layout**: Decoupled FastAPI architecture separating API routing, core security, data schemas, and vector store operations.

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.13+, FastAPI, SQLAlchemy ORM |
| **Frontend** | Vanilla JavaScript, Tailwind CSS, Vite |
| **AI / Retrieval** | LangChain, ChromaDB, SentenceTransformers |
| **Database** | SQLite (managed through SQLAlchemy) |

## Architecture & Directory Structure

```text
ai-customer-support-platform/
├── backend/
│   ├── src/
│   │   ├── api/        # RESTful API endpoints for Auth, Chat, and Tickets
│   │   ├── core/       # Global configuration & security middleware
│   │   ├── models/     # Database schemas & ORM entities
│   │   └── services/   # AI agent logic, RAG pipelines, and VectorStore clients
│   ├── tests/          # Integration and unit test suites
│   └── tools/          # Diagnostics and testing utilities
├── frontend/
│   ├── src/            # Client-side JavaScript, TypeScript, and CSS assets
│   ├── templates/      # Jinja2 templates for Admin and Chat UI
│   └── static/         # Compiled production assets
└── specs/              # Technical specifications, ADRs, and documentation
```

## Setup & Local Execution

### Prerequisites
- Python 3.13+
- Node.js (for frontend asset compilation)
- [Ollama](https://ollama.ai/) running locally for local inference/embeddings

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema
python init_db.py

# Launch API server
python src/api/main.py
```

### Frontend Build

```bash
cd frontend

# Install package dependencies
npm install

# Build static assets
npm run build
```

## Roadmap & Planned Enhancements

- [ ] Support for commercial LLM providers (GPT-4 / Claude APIs).
- [ ] Real-time bidirectional communication via WebSockets.
- [ ] Advanced support analytics and performance reporting.
