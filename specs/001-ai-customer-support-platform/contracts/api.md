# API Contracts: AI Customer Support Platform

## Base URL: `/api/v1`

### 1. Chat Interface (Customer)

#### `POST /chat/message`
Send a user message to the AI agent.
- **Request**:
  - `user_id`: UUID
  - `message`: String
  - `ticket_id`: UUID (Optional, for existing sessions)
- **Response**:
  - `ticket_id`: UUID
  - `response`: String (AI's answer)
  - `status`: Enum (AI_RESOLVED, PENDING_HUMAN)
  - `sources`: List[String] (Links to knowledge base documents used)

#### `GET /chat/history/{ticket_id}`
Retrieve chat history for a specific ticket.
- **Response**:
  - `messages`: List[MessageObject]

---

### 2. Knowledge Base Management (Admin)

#### `POST /admin/kb/upload`
Upload a new document to the knowledge base.
- **Request**:
  - `file`: File (PDF/TXT)
  - `admin_id`: UUID
- **Response**:
  - `document_id`: UUID
  - `status`: "Success"

#### `DELETE /admin/kb/document/{document_id}`
Remove a document from the knowledge base.
- **Response**:
  - `status`: "Deleted"

---

### 3. Ticket Management (Human Agent)

#### `GET /agent/tickets/pending`
Retrieve all tickets pending human review.
- **Response**:
  - `tickets`: List[TicketObject]

#### `POST /agent/tickets/{ticket_id}/resolve`
Mark a ticket as resolved by a human agent.
- **Request**:
  - `resolution_note`: String
- **Response**:
  - `status`: "Resolved"
