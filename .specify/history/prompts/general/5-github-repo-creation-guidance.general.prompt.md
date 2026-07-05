---
id: 5
title: GitHub Repo Creation Guidance
stage: general
date_iso: 2026-06-14
surface: agent
model: gemini-2.0-flash-thinking-exp
feature: none
branch: master
user: Abdul Aziz
command: none
labels: ["github", "setup", "guidance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files_yaml:
  - .specify/history/prompts/general/5-github-repo-creation-guidance.general.prompt.md
tests_yaml:
  - none
---

### PROMPT_TEXT
bhai repo kis name se bnao or sirf name likh kar create kar du ya kiya karu ye bta do to me kar ta hu

### RESPONSE_TEXT
Bhai, aap repo ka naam **`calculator-project`** rakh lein. Repository create karte waqt "Add a README file", "Add .gitignore", aur "Choose a license" mein se kisi ko bhi check mat kariyega. Hamein bilkul "Empty" repo chahiye. Bas naam likhein aur "Create repository" kar ke mujhe HTTPS link de dein.

### OUTCOME
User ko repo name aur settings (empty repo) ke baare mein guide kar diya gaya hai taake local files asani se push ho sakein.
