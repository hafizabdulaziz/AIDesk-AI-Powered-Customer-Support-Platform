# Tasks: AI Customer Support Platform

**Input**: Design documents from `/specs/001-ai-customer-support-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure (backend/ and frontend/ directories)
- [ ] T002 [P] Initialize Python 3.13 project in backend/ with FastAPI, LangChain, and Pydantic
- [ ] T003 [P] Initialize React (TypeScript) project in frontend/
- [ ] T004 [P] Configure linting (ruff/eslint) and formatting (black/prettier)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T005 Setup PostgreSQL database schema for Users, Tickets, and Messages using SQLAlchemy
- [ ] T006 [P] Setup ChromaDB local instance for vector storage
- [ ] T007 [P] Implement environment configuration management (pydantic-settings)
- [ ] T008 [P] Setup base FastAPI routing and global error handling middleware
- [ ] T009 Implement base Pydantic models for common entities (User, Ticket)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI-Driven Ticket Resolution (Priority: P1) 🎯 MVP

**Goal**: Provide instant answers via AI using a RAG pipeline.
**Independent Test**: Submit a query via API and receive a grounded answer based on the KB.

### Tests for User Story 1 ⚠️
- [ ] T010 [P] [US1] Unit test for RAG retrieval logic in backend/tests/unit/test_rag.py
- [ ] T011 [P] [US1] Integration test for `/chat/message` endpoint in backend/tests/integration/test_chat.py

### Implementation for User Story 1
- [ ] T012 [P] [US1] Implement embedding service in backend/src/services/embeddings.py
- [ ] T013 [P] [US1] Implement RAG retrieval service in backend/src/services/rag_service.py
- [ ] T014 [US1] Implement AI response generation logic in backend/src/services/ai_agent.py (depends on T013)
- [ ] T015 [US1] Implement `/chat/message` endpoint in backend/src/api/chat.py
- [ ] T016 [US1] Create basic Web Chat UI component in frontend/src/components/ChatWindow.tsx
- [ ] T017 [US1] Integrate frontend chat with backend API

**Checkpoint**: MVP Functional - AI can answer questions based on knowledge base.

---

## Phase 4: User Story 2 - Knowledge Base Management (Priority: P2)

**Goal**: Allow admins to upload and manage knowledge base documents.
**Independent Test**: Upload a file and verify that subsequent AI queries reflect its content.

### Tests for User Story 2 ⚠️
- [ ] T020 [P] [US2] Unit test for document chunking and embedding in backend/tests/unit/test_kb.py
- [ ] T021 [P] [US2] Integration test for `/admin/kb/upload` in backend/tests/integration/test_admin.py

### Implementation for User Story 2
- [ ] T022 [P] [US2] Implement document loader and chunking logic in backend/src/services/kb_manager.py
- [ ] T023 [US2] Implement document upload and embedding pipeline in backend/src/services/kb_manager.py
- [ ] T024 [US2] Implement `/admin/kb/upload` and `/admin/kb/document/{id}` endpoints in backend/src/api/admin.py
- [ ] T025 [US2] Create Admin KB Management UI in frontend/src/pages/AdminDashboard.tsx

**Checkpoint**: Knowledge base is now manageable by administrators.

---

## Phase 5: User Story 3 - Human Agent Handoff (Priority: P3)

**Goal**: Seamlessly transition to a human agent when AI fails.
**Independent Test**: Trigger a handoff and verify ticket status changes to `PENDING_HUMAN`.

### Tests for User Story 3 ⚠️
- [ ] T030 [P] [US3] Unit test for handoff trigger logic in backend/tests/unit/test_handoff.py
- [ ] T031 [P] [US3] Integration test for ticket status transition in backend/tests/integration/test_tickets.py

### Implementation for User Story 3
- [ ] T032 [US3] Implement handoff detection logic in backend/src/services/ai_agent.py
- [ ] T033 [US3] Implement ticket status update and notification logic in backend/src/services/ticket_service.py
- [ ] T034 [US3] Implement `/agent/tickets/pending` endpoint for human agents in backend/src/api/agent.py
- [ ] T035 [US3] Create simple Agent Ticket View in frontend/src/pages/AgentView.tsx

**Checkpoint**: Full loop complete - AI $ightarrow$ Human handoff operational.

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T100 [P] Implement 90-day data retention background worker (Celery/Cron)
- [ ] T101 [P] Add RAGAS evaluation to the testing pipeline for grounding check
- [ ] T102 [P] Implement basic authentication for Admin and Agent roles
- [ ] T103 [P] Enhance UI/UX with loading states and better error messaging
- [ ] T104 [P] Final end-to-end validation against success criteria (SC-001 to SC-004)

---

## Dependencies & Execution Order
- **Phase 1 $ightarrow$ Phase 2**: Setup must be done before Foundational.
- **Phase 2 $ightarrow$ Phase 3/4/5**: Foundation (DB, Vector Store) must be ready before any User Story.
- **US1 (P1)**: Highest priority, delivers MVP.
- **US2 (P2)**: Necessary for scaling the KB.
- **US3 (P3)**: Finalizes the customer journey.
