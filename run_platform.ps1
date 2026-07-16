# Run this script to launch the AI Support Platform
Write-Host "🚀 Launching AI Customer Support Platform..." -ForegroundColor Cyan

# 0. Cleanup port 8001
Write-Host "🧹 Checking port 8001..." -ForegroundColor Yellow
$pidToKill = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($pidToKill) {
    Write-Host "🛑 Killing existing process on port 8001 (PID: $pidToKill)..." -ForegroundColor Red
    Stop-Process -Id $pidToKill -Force
    Start-Sleep -Seconds 2
}

# 1. Start Backend in a background process
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'backend'; .\venv\Scripts\activate; `$env:PYTHONPATH='src'; python src/api/main.py" -PassThru

Write-Host "🌐 Backend started (PID: $($backendJob.Id))." -ForegroundColor Yellow

# 2. Wait for backend to be ready
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 3. Open browser
Write-Host "🌍 Opening Platform in Browser..." -ForegroundColor Green
Start-Process "http://localhost:8001/chat"

Write-Host "`n✅ Platform is running!" -ForegroundColor Green
Write-Host "👉 Press Ctrl+C in the backend window to stop." -ForegroundColor White
