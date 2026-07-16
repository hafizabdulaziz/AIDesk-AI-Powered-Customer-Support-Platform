@echo off
echo Starting AI Customer Support Platform...

:: Start Backend in a new window
start "Backend API" cmd /k "cd backend && set PYTHONPATH=src && python src/api/main.py"

:: Wait a few seconds for backend to start
timeout /t 5

:: Start Frontend in a new window
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo Platform started.
echo Backend running on http://localhost:8000
echo Frontend running on the port shown in the Frontend window.
pause
