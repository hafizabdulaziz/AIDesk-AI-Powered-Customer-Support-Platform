---
id: 35
title: Switch Embeddings to Ollama
stage: green
date_iso: 2026-07-12
surface: agent
model: gemini-1.5-pro
feature: 001-ai-customer-support-platform
branch: main
user: Abdul Aziz
command: replace backend/src/services/embeddings.py
labels: ["ollama", "embeddings", "local-ai", "fix"]
links:
  tasks: "specs/001-ai-customer-support-platform/tasks.md"
files_yaml:
  - backend/src/services/embeddings.py
---

# Prompt History Record (PHR) - 35

## User Prompt
Switch to Ollama and fix API errors.

## Assistant Response
Updated `EmbeddingService` to use `OllamaEmbeddings` instead of `OpenAIEmbeddings`. This removes the dependence on the external Gemini API and solves the 501 Internal Server Error.

## Outcome
Full local AI pipeline (LLM + Embeddings) now operational via Ollama.
