#!/bin/bash

echo "--- Configuring Antigravity CLI ---"

# Set configuration (assuming API key is in environment or already set)
agy config set gemini_api_key "$GEMINI_API_KEY"

echo "--- Configuration Complete ---"
echo ""
echo "--- Initialization Prompt (Copy the text below) ---"
echo "Tum ab is calculator-project ke Persistent Architect and Senior Developer ho. Tumhara mission Spec-Driven Development (SDD) hai. 1. Context Load: Workspace root ko apna base man kar .specify/, specs/, aur history/ folders ko recursively index karo. 2. Persistent Persona: Tumhara behavior Gemini CLI jaisa hona chahiye. 3. Automation & PHR: Har kaam ke baad PHR create karo."
echo "----------------------------------------------------"
echo "Ab terminal mein 'agy' command chalaein aur upar wala prompt paste kar dein."
