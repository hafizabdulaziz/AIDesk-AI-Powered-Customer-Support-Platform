# Tasks: AI Customer Support Platform

**Input**: Design documents from `/specs/001-ai-customer-support-platform/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Tests**: pytest and RAGAS testing are explicitly requested in the specification and plan. Unit, integration, and contract tests are included in the task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directories (backend/ and frontend/ directories) and verify workspace layout
- [ ] T002 [P] Initialize Python 3.13 project in backend/ with dependencies in pyproject.toml
- [ ] T003 [P] Initialize React (TypeScript) project in frontend/ with package.json
- [ ] T004 [P] Configure linting (ruff/eslint) and formatting (black/prettier/oxlint) in backend/pyproject.toml and frontend/.oxlintrc.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Setup PostgreSQL database schema connection, SessionLocal, and engine in backend/src/models/database.py
- [ ] T006 [P] Setup local ChromaDB client connection instance in backend/src/services/vector_store.py
- [ ] T007 [P] Implement environment configuration management using Pydantic Settings in backend/src/core/config.py
- [ ] T008 [P] Setup base FastAPI application routing, routes registration, and global exception handling in backend/src/api/main.py
- [ ] T009 Implement base database schemas and Pydantic validation models (User, Ticket, Message, Admin) in backend/src/models/schemas.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI-Driven Ticket Resolution (Priority: P1) 🎯 MVP

**Goal**: Provide instant, accurate answers to customer questions using a grounded RAG pipeline.

**Independent Test**: Send a POST query to `/api/v1/chat/message` with a user question and receive a grounded response using ChromaDB-retrieved documents.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Create unit tests for RAG retrieval logic in backend/tests/unit/test_rag.py
- [ ] T011 [P] [US1] Create integration tests for chat message flow `/chat/message` in backend/tests/integration/test_chat.py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement OpenAI/Anthropic embedding service integration in backend/src/services/embeddings.py
- [ ] T013 [P] [US1] Implement RAG search query and document retrieval in backend/src/services/rag_service.py (depends on T012)
- [ ] T014 [US1] Implement LLM prompting, system instruction, history management, and grounding logic in backend/src/services/ai_agent.py (depends on T013)
- [ ] T015 [US1] Implement POST `/api/v1/chat/message` and GET `/api/v1/chat/history/{ticket_id}` endpoints in backend/src/api/chat.py
- [ ] T016 [US1] Create chat window UI component with streaming-like message rendering in frontend/src/App.tsx
- [ ] T017 [US1] Integrate frontend chat component with backend `/api/v1/chat/message` API in frontend/src/App.tsx

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Knowledge Base Management (Priority: P2)

**Goal**: Allow administrators to upload, process, chunk, embed, and manage knowledge base documents.

**Independent Test**: Upload a text/PDF file through `/api/v1/admin/kb/upload`, verify it chunks, embeds, and indexes in ChromaDB, and subsequent AI queries fetch its content.

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Create unit tests for document chunking, hashing, and embedding pipelines in backend/tests/unit/test_kb.py
- [ ] T019 [P] [US2] Create integration tests for KB endpoints `/admin/kb/upload` and `/admin/kb/document/{id}` in backend/tests/integration/test_admin.py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement PDF/TXT file loading and recursive text chunking in backend/src/services/kb_manager.py
- [ ] T021 [US2] Implement vector indexing pipeline (adding and removing embeddings from ChromaDB) in backend/src/services/kb_manager.py
- [ ] T022 [US2] Implement POST `/api/v1/admin/kb/upload` and DELETE `/api/v1/admin/kb/document/{document_id}` endpoints in backend/src/api/admin.py (new file)
- [ ] T023 [US2] Create Admin Knowledge Base Management page with upload and list components in frontend/src/pages/AdminDashboard.tsx (new file)

**Checkpoint**: At this point, User Stories 1 AND 2 work together. Administrators can update the AI's knowledge.

---

## Phase 5: User Story 3 - Human Agent Handoff (Priority: P3)

**Goal**: Seamlessly transition complex customer queries to a human agent when AI cannot resolve them.

**Independent Test**: Submit a query that triggers low-confidence or matches a manual handoff keyphrase, verify ticket status is `PENDING_HUMAN`, and verify it appears in the agent dashboard.

### Tests for User Story 3 ⚠️

- [ ] T024 [P] [US3] Create unit tests for handoff state detection and ticket transition criteria in backend/tests/unit/test_handoff.py
- [ ] T025 [P] [US3] Create integration tests for agent ticket retrieval `/agent/tickets/pending` in backend/tests/integration/test_tickets.py

### Implementation for User Story 3

- [ ] T026 [US3] Implement LLM self-confidence evaluation or explicit handoff detection rules in backend/src/services/ai_agent.py
- [ ] T027 [US3] Implement ticket update helper and status transition logic in backend/src/services/ticket_service.py (new file)
- [ ] T028 [US3] Implement GET `/api/v1/agent/tickets/pending` and POST `/api/v1/agent/tickets/{ticket_id}/resolve` endpoints in backend/src/api/agent.py (new file)
- [ ] T029 [US3] Create Agent Portal UI featuring pending tickets list and full ticket chat history view in frontend/src/pages/AgentView.tsx (new file)

**Checkpoint**: All user stories are now independently functional and integrated into a unified flow.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Operational enhancements, security compliance, data management, and final validation.

- [ ] T030 [P] Implement Celery/Cron-compatible background worker for 90-day data retention policy in backend/src/services/cleanup_worker.py
- [ ] T031 [P] Implement RAGAS evaluation pipeline to check prompt correctness and grounding score in backend/tests/integration/test_ragas.py
- [ ] T032 [P] Implement Role-Based Access Control middleware (Admin/Agent) and JWT authentication in backend/src/core/auth.py (new file)
- [ ] T033 Polish frontend interface with modern styling, loading spinners, and error alerts in frontend/src/App.tsx
- [ ] T034 Run full end-to-end quickstart.md validation script in quickstart_check.py

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel (if staffed).
  - Or sequentially in priority order (P1 → P2 → P3).
- **Polish (Final Phase)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Deliverable MVP.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Can run in parallel with US1.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 chat endpoints.

### Within Each User Story

- Tests MUST be written and fail before implementation begins.
- Models and schemas before services.
- Services before endpoints.
- Integration testing before client UI implementation.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004).
- Foundational tasks marked [P] can run in parallel (T006, T007, T008).
- Once Phase 2 is complete, different developers can implement US1 (T010-T017) and US2 (T018-T023) in parallel.
- All testing tasks marked [P] can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch both unit and integration tests for User Story 1 in parallel:
pytest backend/tests/unit/test_rag.py backend/tests/integration/test_chat.py

# Parallel setup of embeddings and database model preparation:
# Developer A works on: backend/src/services/embeddings.py
# Developer B works on: backend/src/models/schemas.py (User, Ticket, Message fields)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - database & FastAPI boilerplate)
3. Complete Phase 3: User Story 1 (RAG, embedding service, main Chat GUI)
4. **STOP and VALIDATE**: Run unit and integration tests to ensure grounding works flawlessly.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready.
2. Add User Story 1 → Test independently → Deploy/Demo (MVP ready!).
3. Add User Story 2 → Test independently (Admins can now feed data to AI) → Deploy/Demo.
4. Add User Story 3 → Test independently (Human agents can take over tickets) → Deploy/Demo.
5. Apply Phase N Polish → Final verification and automated RAGAS evaluations.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- Verify tests fail before implementing.
- Commit after each task or logical group.
- Stop at any checkpoint to validate story independently.
