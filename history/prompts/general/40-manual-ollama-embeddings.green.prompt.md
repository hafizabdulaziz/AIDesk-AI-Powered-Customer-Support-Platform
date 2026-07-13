---
id: 40
title: Manual Ollama Embeddings via Subprocess
stage: green
date_iso: 2026-07-12
surface: agent
model: gemini-1.5-pro
feature: 001-ai-customer-support-platform
branch: main
user: Abdul Aziz
command: replace backend/src/services/embeddings.py
labels: ["ollama", "embeddings", "subprocess", "fix"]
links:
  tasks: "specs/001-ai-customer-support-platform/tasks.md"
files_yaml:
  - backend/src/services/embeddings.py
---

# Prompt History Record (PHR) - 40

## User Prompt
Fix Ollama embeddings error by using subprocess.

## Assistant Response
Updated `EmbeddingService` to use `subprocess` to call the `ollama embed` command directly. This bypasses the `langchain-ollama` dependency and avoids the `501 UNIMPLEMENTED` error from the OpenAI-compatible endpoint.

## Outcome
A robust, fully local embedding pipeline is now established using the installed `llama3.2` model via the Ollama CLI.
