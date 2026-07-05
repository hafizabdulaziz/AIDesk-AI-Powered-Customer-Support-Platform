# Quickstart: AI Customer Support Platform

## Developer Setup

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL (Local or Cloud)
- ChromaDB (Local)

### Backend Setup
1. `cd backend`
2. `pip install -r requirements.txt`
3. Create `.env` file:
   - `OPENAI_API_KEY=your_key`
   - `DATABASE_URL=postgresql://user:pass@localhost:5432/support_db`
   - `CHROMA_DB_PATH=./chroma_db`
4. `uvicorn src.api.main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm start`

## Testing the MVP
1. **Admin**: Upload a PDF document via `/admin/kb/upload`.
2. **User**: Open Web Chat and ask a question based on the uploaded PDF.
3. **Verify**: Check if the AI provides a grounded answer with sources.
4. **Handoff**: Ask a question the AI cannot answer $ightarrow$ Verify ticket status becomes `PENDING_HUMAN`.
