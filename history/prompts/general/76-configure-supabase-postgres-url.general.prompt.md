---
id: 76
title: configure-supabase-postgres-url
stage: general
date: 2026-11-09
surface: agent
model: gemini-cli
feature: none
branch: main
user: Abdul Aziz
command: chat
labels: ["database", "supabase", "vercel", "postgresql", "sqlalchemy"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/core/config.py
tests:
  - pytest tests/unit/
---

## Prompt

Supabase is now connected to my existing Vercel project. Vercel has automatically added POSTGRES_URL, POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL and other Supabase variables for Production and Preview. My backend currently expects DATABASE_URL. Make the smallest safe change: update backend/src/core/config.py to use DATABASE_URL if explicitly provided, otherwise use POSTGRES_URL. Ensure compatibility with SQLAlchemy 2.0 and psycopg2-binary, use POSTGRES_URL for Vercel serverless runtime and preserve NullPool.

## Response snapshot

Updated `backend/src/core/config.py` to support `DATABASE_URL` with fallback to `POSTGRES_URL` (and default local fallback). Added robust sanitization for SQLAlchemy 2.0 / `psycopg2-binary` compatibility (`postgres://` to `postgresql://`). Verified unit tests pass successfully.

## Outcome

- ✅ Impact: Backend configuration now correctly accepts and utilizes Vercel/Supabase `POSTGRES_URL` environment variables while maintaining SQLAlchemy 2.0 and NullPool compatibility.
- 🧪 Tests: Unit tests passed successfully.
- 📁 Files: backend/src/core/config.py
- 🔁 Next prompts: Verify live login testing once deployed.
- 🧠 Reflection: Supporting fallback between `DATABASE_URL` and provider-specific variables like `POSTGRES_URL` ensures seamless integration with Vercel storage integrations.
