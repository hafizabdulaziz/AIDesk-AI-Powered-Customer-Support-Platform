<!--
Sync Impact Report:
- Version change: 1.1.1 -> 1.0.0
- List of modified principles:
    - Project renamed from "Calculator Project" to "AI Customer Support Platform"
    - Updated core principles to focus on AI-driven support and customer experience.
    - Updated technical stack to reflect AI requirements (LLMs, Vector Databases).
- Added sections: None
- Templates requiring updates:
    - templates/plan-template.md (✅ checked)
    - templates/spec-template.md (✅ checked)
    - templates/tasks-template.md (✅ checked)
- Follow-up TODOs: None
-->

# AI Customer Support Platform Constitution

## Core Principles

### I. User-Centric AI Experience (NON-NEGOTIABLE)
The primary goal is to provide instant, accurate, and helpful support. AI responses MUST be grounded in the project's knowledge base to minimize hallucinations. Every AI interaction MUST be designed to either resolve the issue or provide a seamless path to human escalation.

### II. TDD and Verification-Driven Development
TDD is mandatory for all core logic. Tests MUST be written and fail before any implementation begins. For AI components, we utilize evaluation frameworks to measure accuracy, groundedness, and safety. The Red-Green-Refactor cycle is strictly followed for all new features and bug fixes.

### III. Clean Architecture & Modular Design
We prioritize maintainability and scalability. The system MUST be decoupled, allowing for easy replacement of LLM providers, vector databases, or interface layers. Adhere to SOLID, DRY, and KISS principles. Prefer explicit composition over complex inheritance.

### IV. Strict Type Safety & Readability
All code MUST use Python 3.13+ with comprehensive type hints.
- **Type Hints**: All functions MUST include type hints on parameters and return types.
- **Readability**: Follow PEP 8 strictly. All functions MUST include clear docstrings.
- **Naming**: Use descriptive names that convey intent. Avoid magic numbers and cleverness over clarity.

### V. Architectural Decision Records (ADR)
All architecturally significant decisions MUST be documented via ADRs in `history/adr/`. We record the context, alternatives considered, and the trade-offs made to preserve the "why" for future developers.

## Technical Stack

### Core Technologies
- **Language**: Python 3.13+
- **LLM Framework**: LangChain or LlamaIndex (to be finalized in ADR)
- **Vector Database**: ChromaDB or Pinecone (to be finalized in ADR)
- **Testing**: pytest (primary testing framework)
- **Version Control**: Git

## Quality Requirements

### Testing & Evaluation
- **Pass Rate**: All functional tests MUST pass before any code is merged.
- **AI Evaluation**: AI responses must be evaluated for groundedness (faithfulness to knowledge base) and relevance.
- **Data Structures**: Use Python `dataclasses` for data-heavy structures.

## Governance

### Amendment Process
This constitution is a living document. Amendments require a version bump following semantic versioning rules (MAJOR.MINOR.PATCH) and must be documented in the Sync Impact Report.

### Compliance
Every Pull Request and code review must verify compliance with these principles. Non-compliant code will not be accepted into the main branch.

**Version**: 1.0.0 | **Ratified**: 2026-07-05 | **Last Amended**: 2026-07-05
