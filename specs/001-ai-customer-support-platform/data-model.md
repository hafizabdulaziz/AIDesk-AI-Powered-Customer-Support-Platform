# Data Model: AI Customer Support Platform

## Entities

### 1. User
Represents a customer interacting with the platform.
- `id`: UUID (Primary Key)
- `email`: String (Unique, Indexed)
- `created_at`: Timestamp
- `last_active`: Timestamp

### 2. Administrator
Represents a staff member managing the knowledge base.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `role`: Enum (SUPER_ADMIN, KB_MANAGER)

### 3. KnowledgeBaseDocument
Represents a source document uploaded by an administrator.
- `id`: UUID (Primary Key)
- `filename`: String
- `content_hash`: String (To detect duplicates)
- `upload_date`: Timestamp
- `uploaded_by`: UUID (Foreign Key $ightarrow$ Administrator)
- `status`: Enum (ACTIVE, DELETED)

### 4. Ticket
Represents a support interaction session.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key $ightarrow$ User)
- `status`: Enum (OPEN, AI_RESOLVED, PENDING_HUMAN, CLOSED)
- `created_at`: Timestamp
- `updated_at`: Timestamp
- `resolved_at`: Timestamp (Optional)

### 5. Message
Represents a single exchange in a ticket.
- `id`: UUID (Primary Key)
- `ticket_id`: UUID (Foreign Key $ightarrow$ Ticket)
- `sender`: Enum (USER, AI, HUMAN_AGENT)
- `content`: Text
- `timestamp`: Timestamp
- `metadata`: JSON (Stores RAG sources, confidence scores)

## Relationships

- **User $ightarrow$ Ticket**: One-to-Many. A user can have multiple support tickets over time.
- **Administrator $ightarrow$ KnowledgeBaseDocument**: One-to-Many. An admin can upload multiple documents.
- **Ticket $ightarrow$ Message**: One-to-Many. A ticket consists of a sequence of messages.

## Constraints & Validation
- **Retention**: Messages and Tickets older than 90 days must be purged via a background worker.
- **Integrity**: If a `KnowledgeBaseDocument` is marked as DELETED, the corresponding embeddings in ChromaDB MUST be removed.
