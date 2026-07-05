---
id: 8
title: Clarifying Calculator Library Requirements
stage: spec
date: 2026-06-15
surface: agent
model: gemini-2.0-flash-thinking-preview
feature: calculator-core
branch: main
user: Abdul Aziz
command: clarification
labels: ["requirements", "sdd", "calculator"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - history/prompts/calculator-core/8-clarifying-requirements.spec.prompt.md
tests:
  - none
---

## Prompt

I'm writing a specification for a calculator Python library. 
Let me clarify what success looks like with you:

1. What operations should my calculator support?
2. What edge cases should I handle?
3. What's my definition of "correct" for floating-point results?
4. How should the calculator interface work? (Library vs CLI?)
5. What should happen with invalid inputs?

## Response snapshot

Assalam-o-Alaikum Abdul Aziz! Main aapki calculator library ki specification likhne mein madad karunga. 

1. Operations: Basic (add, subtract, multiply, divide) as standard, Advanced (power, sqrt) as options.
2. Edge cases: Division by zero, overflow, invalid types.
3. Floating point: Decimal for precision or math.isclose for tests.
4. Interface: Library core first, CLI as wrapper.
5. Invalid inputs: Custom exceptions and strict validation.

Surface: Project level guidance for Spec-Driven Development.
Success: A clear, comprehensive specification that defines the calculator's behavior, edge cases, and interface.

## Outcome

- ✅ Impact: Established initial requirements for the calculator library.
- 🧪 Tests: None yet.
- 📁 Files: Created PHR.
- 🔁 Next prompts: Creating the spec.md file.
- 🧠 Reflection: User is following SDD correctly by clarifying success criteria first.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
