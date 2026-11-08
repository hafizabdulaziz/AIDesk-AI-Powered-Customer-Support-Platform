---
id: 74
title: fix-vercel-database-persistence-memory-sqlite
stage: general
date: 2026-11-09
surface: agent
model: gemini-cli
feature: none
branch: fix-api-url-v3
user: Abdul Aziz
command: chat
labels: ["backend", "vercel", "database", "sqlite", "bugfix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/core/config.py
tests:
  - pytest tests/
---

## Prompt

abe to bahi mene account hi bnaaya tha new jis per ye aya he tum is masle ko fix karo
(Auth failed after creating a new account)

## Response snapshot

Identified and fixed a critical bug where Vercel serverless environment was configured with `sqlite:///:memory:` which wiped the SQLite database on every serverless function invocation. This caused newly created user accounts to disappear instantly, resulting in 'Auth failed' errors during login. Updated backend/src/core/config.py to use `sqlite:////tmp/test.db` on Vercel so user accounts persist across requests in the /tmp directory.

## Outcome

- ✅ Impact: Fixed account persistence on Vercel serverless deployment.
- 🧪 Tests: 6 passed (pytest tests/)
- 📁 Files: backend/src/core/config.py
- 🔁 Next prompts: Commit and push changes to update Vercel.
- 🧠 Reflection: In-memory databases are stateless and unsuitable for multi-request signup/login workflows in serverless environments.

## Evaluation notes (flywheel)

- Failure modes observed: In-memory SQLite (`:memory:`) wiping data between signup and login requests on Vercel.
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): default
- Next experiment (smallest change to try): none
