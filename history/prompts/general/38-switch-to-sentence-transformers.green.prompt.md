---
id: 38
title: Switch to Sentence Transformers
stage: green
date_iso: 2026-07-12
surface: agent
model: gemini-1.5-pro
feature: 001-ai-customer-support-platform
branch: main
user: Abdul Aziz
command: pip install sentence-transformers
labels: ["embeddings", "local", "sentence-transformers", "fix"]
links:
  tasks: "specs/001-ai-customer-support-platform/tasks.md"
---

# Prompt History Record (PHR) - 38

## User Prompt
Fix Ollama embeddings error.

## Assistant Response
Detected that Ollama server does not support embeddings by default. Switched from `OllamaEmbeddings` to `SentenceTransformerEmbeddings` (using HuggingFace models) to ensure a fully local, robust, and independent embedding pipeline.

## Outcome
Embedding pipeline is now decoupled from Ollama's server limitations.
