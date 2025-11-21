# Stop All Backend and Frontend Servers
# This script stops all Python (backend) and Node (frontend) processes

Write-Host "`n========================================" -ForegroundColor Red
Write-Host "🛑 Stopping Academic Portal Services" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Red

# Stop Python processes (Backend)
Write-Host "🔴 Stopping Backend (Python)..." -ForegroundColor Yellow
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Stop-Process -Name python -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Stopped $($pythonProcesses.Count) Python process(es)" -ForegroundColor Green
} else {
    Write-Host "   ℹ No Python processes running" -ForegroundColor Gray
}

# Stop Node processes (Frontend)
Write-Host "🔴 Stopping Frontend (Node.js)..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Stopped $($nodeProcesses.Count) Node process(es)" -ForegroundColor Green
} else {
    Write-Host "   ℹ No Node processes running" -ForegroundColor Gray
}

# Stop Next.js dev processes
$nextProcesses = Get-Process next-server -ErrorAction SilentlyContinue
if ($nextProcesses) {
    Stop-Process -Name next-server -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ Stopped Next.js dev server" -ForegroundColor Green
}

Start-Sleep -Seconds 1

Write-Host "`n✅ All servers stopped!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Red
