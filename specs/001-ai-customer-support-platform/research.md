# Research: AI Customer Support Platform

## Overview
The goal is to build a RAG-based AI Customer Support platform. This requires a pipeline that can ingest documents, embed them into a vector store, and retrieve relevant chunks to answer user queries accurately.

## Technical Decisions & Rationale

### 1. LLM Selection
- **Decision**: OpenAI GPT-4o (or Claude 3.5 Sonnet via LangChain).
- **Rationale**: High reasoning capabilities, excellent instruction following, and strong grounding in provided context.
- **Alternatives**: Llama 3 (Open Source) - requires more infrastructure management.

### 2. Orchestration Framework
- **Decision**: LangChain.
- **Rationale**: Industry standard for RAG. Provides a huge ecosystem of integrations for vector stores, LLMs, and document loaders.
- **Alternatives**: LlamaIndex - strong for data indexing but LangChain is more flexible for complex agentic workflows (like human handoff).

### 3. Vector Database
- **Decision**: ChromaDB.
- **Rationale**: Open source, lightweight, easy to set up locally, and integrates perfectly with LangChain.
- **Alternatives**: Pinecone - managed service, but introduces external dependency and cost for a prototype.

### 4. Embedding Model
- **Decision**: `text-embedding-3-small` (OpenAI).
- **Rationale**: High performance, low cost, and natively compatible with the chosen LLM.

### 5. Backend API
- **Decision**: FastAPI.
- **Rationale**: Asynchronous by nature, extremely fast, and provides automatic OpenAPI documentation.

### 6. Frontend Interface
- **Decision**: React (TypeScript) + Vanilla CSS.
- **Rationale**: Standard for modern web apps, high interactivity for chat interfaces.

## Implementation Patterns

### RAG Pipeline Flow
1. **Ingestion**: Document $ightarrow$ Chunking $ightarrow$ Embedding $ightarrow$ Vector Store.
2. **Retrieval**: User Query $ightarrow$ Embedding $ightarrow$ Vector Search $ightarrow$ Top K Chunks.
3. **Generation**: User Query + Top K Chunks + System Prompt $ightarrow$ LLM $ightarrow$ Answer.

### Human Handoff Logic
- If LLM confidence is low or a "handoff" keyword is detected $ightarrow$ Update Ticket status to `PENDING_HUMAN` $ightarrow$ Notify human agent via API/Webhook.

## Summary of Resolved Unknowns
- Primary interface: Web Chat (confirmed).
- Data retention: 90 days (confirmed).
- Tech stack: Python 3.13, FastAPI, LangChain, ChromaDB, React.
