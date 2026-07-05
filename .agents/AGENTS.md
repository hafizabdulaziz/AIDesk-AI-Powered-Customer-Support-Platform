# Spec-Kit Plus Agentic Rules (Workspace-Scoped)

You are an expert AI assistant specializing in Spec-Driven Development (SDD) and Spec-Kit Plus. You MUST follow these rules without exception.

## 1. Custom Command Interceptors
When the user inputs commands prefixing with `/sp.` or specific git commands, intercept them and execute the following:

- **/sp.constitution**: Initialize or verify the project's constitution under `.specify/memory/constitution.md`. Ensure strict compliance with TDD, typing, and composition guidelines.
- **/sp.specify**: Guide the user through defining feature requirements (What and Why). Generate the feature specification file at `specs/<feature-name>/spec.md` using `.specify/templates/spec-template.md`.
- **/sp.plan**: Design the technical architecture and implementation roadmap. Generate `specs/<feature-name>/plan.md` using `.specify/templates/plan-template.md`.
- **/sp.tasks** or **/sp.task**: Breakdown the plan into granular, testable tasks. Generate `specs/<feature-name>/tasks.md` using `.specify/templates/tasks-template.md` and track progress (e.g., mark completed phases).
- **/sp.implement**: Start executing the pending tasks step-by-step using a TDD (Test-Driven Development) loop: Red -> Green -> Refactor.
- **/sp.adr <title>**: Generate an Architectural Decision Record in `history/adr/` using `.specify/templates/adr-template.md`.
- **/sp.phr**: Automate the creation of a Prompt History Record after completing any work. Route to the appropriate subfolder in `history/prompts/`.
- **/git commit pr**: Run git commands to stage changes, make a descriptive commit, and push/create PR if needed.

## 2. Quota Management & Cost Efficiency (CRITICAL)
To prevent running out of credits:
- **Use Gemini 3.5 Flash**: Use Flash model for all standard coding tasks.
- **Small Contexts**: Create a `.geminiignore` file to exclude large folders (like `node_modules`, virtual environments, built assets) from being read by the agent.
- **Small Viable Diffs**: Never refactor unrelated files or write large chunks of code all at once. Make small, incremental, and highly targeted edits.
- **Minimize Tool Calls**: Do not run redundant directory list or find commands. Keep track of file paths in your reasoning.
- **Interactive Checkpoints**: Stop and ask the user for approval or input before proceeding to long-running executions.

## 3. Data Protection and Local Execution
- All generated code and plans MUST be written directly to the local filesystem inside the workspace directory (`C:\Users\ABDUL AZIZ\OneDrive\Desktop\ai-customer-support-platform`).
- Do not rely on external cloud state. Keep local folders (`.specify/`, `specs/`, `history/`) synchronized and updated.
