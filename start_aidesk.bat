@echo off
echo Starting AIDesk Platform...

:: Start the backend in a new window
start "AIDesk Backend" cmd /k "cd backend && venv\Scripts\activate && python src/api/main.py"

:: Wait a few seconds for backend to start
timeout /t 5

:: Open the browser directly to the chat page
start http://localhost:8001/chat

echo AIDesk is now running.
echo Backend: http://localhost:8001
echo Frontend: http://localhost:8001/chat
pause
