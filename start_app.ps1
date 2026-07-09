# Master Start Script for AI Customer Support Platform
Write-Host "🚀 Starting AI Customer Support Platform..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "🌐 Launching Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ABDUL AZIZ\OneDrive\Desktop\ai-customer-support-platform\backend'; .\venv\Scripts\activate; `$env:PYTHONPATH='src'; python -m uvicorn api.main:app --reload"

# 2. Start Frontend in a new window
Write-Host "💻 Launching Frontend UI..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\ABDUL AZIZ\OneDrive\Desktop\ai-customer-support-platform\frontend'; npm run dev"

Write-Host "`n✅ Everything is starting! Please wait a few seconds." -ForegroundColor Green
Write-Host "👉 Open your browser and go to: http://localhost:5173" -ForegroundColor White
Write-Host "---------------------------------------------------------"
