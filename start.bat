@echo off
title AI Customer Support Platform Launcher
echo ---------------------------------------------------
echo   Launching AI Customer Support Platform...
echo ---------------------------------------------------

:: Start Backend in a new window
echo Starting Backend Server...
start "AI-Backend" cmd /k "set PYTHONPATH=backend/src && python backend/src/api/main.py"

:: Start Frontend in a new window
echo Starting Frontend UI...
start "AI-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ---------------------------------------------------
echo   DONE! Backend and Frontend are opening.
echo   Please check the new terminal windows.
echo ---------------------------------------------------
pause
