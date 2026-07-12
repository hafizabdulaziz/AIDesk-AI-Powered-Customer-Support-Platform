---
id: 20
title: Investigate Embedding Error and Mock Tests
stage: general
date_iso: 2026-07-12
surface: agent
model: gemini-1.5-pro
feature: 001-ai-customer-support-platform
branch: main
user: Abdul Aziz
command: replace backend/src/core/config.py
labels: ["debug", "testing", "mock-mode"]
links:
  tasks: "specs/001-ai-customer-support-platform/tasks.md"
---

# Prompt History Record (PHR) - 20

## User Prompt
(User hints at fixing test failures)

## Assistant Response
Identified that `text-embedding-004` might be causing a 501 error on the OpenAI-compatible endpoint. Enabled `MOCK_MODE` to verify local logic first.

## Outcome
Switched to Mock Mode to bypass external API issues and validate internal flow.
