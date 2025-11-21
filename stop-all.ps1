# Greenwich Academic Portal - Stop All Services
# This script stops all Backend and Frontend processes and closes their windows

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Stopping All Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootDir = $PSScriptRoot

# Close server windows using saved PIDs
Write-Host "[CLOSING] Server windows..." -ForegroundColor Yellow
$closedWindows = 0

# Close backend window
$backendPidFile = Join-Path $rootDir ".backend_pid.txt"
if (Test-Path $backendPidFile) {
    $backendPid = Get-Content $backendPidFile -ErrorAction SilentlyContinue
    if ($backendPid) {
        $backendWindow = Get-Process -Id $backendPid -ErrorAction SilentlyContinue
        if ($backendWindow) {
            Write-Host "   [CLOSING] Backend window (PID: $backendPid)" -ForegroundColor Gray
            Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
            $closedWindows++
        }
    }
    Remove-Item $backendPidFile -Force -ErrorAction SilentlyContinue
}

# Close admin window
$adminPidFile = Join-Path $rootDir ".admin_pid.txt"
if (Test-Path $adminPidFile) {
    $adminPid = Get-Content $adminPidFile -ErrorAction SilentlyContinue
    if ($adminPid) {
        $adminWindow = Get-Process -Id $adminPid -ErrorAction SilentlyContinue
        if ($adminWindow) {
            Write-Host "   [CLOSING] Admin dashboard window (PID: $adminPid)" -ForegroundColor Gray
            Stop-Process -Id $adminPid -Force -ErrorAction SilentlyContinue
            $closedWindows++
        }
    }
    Remove-Item $adminPidFile -Force -ErrorAction SilentlyContinue
}

# Close frontend window (legacy - keeping for backward compatibility)
$frontendPidFile = Join-Path $rootDir ".frontend_pid.txt"
if (Test-Path $frontendPidFile) {
    $frontendPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue
    if ($frontendPid) {
        $frontendWindow = Get-Process -Id $frontendPid -ErrorAction SilentlyContinue
        if ($frontendWindow) {
            Write-Host "   [CLOSING] Frontend window (PID: $frontendPid)" -ForegroundColor Gray
            Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
            $closedWindows++
        }
    }
    Remove-Item $frontendPidFile -Force -ErrorAction SilentlyContinue
}

# Close mobile window
$mobilePidFile = Join-Path $rootDir ".mobile_pid.txt"
if (Test-Path $mobilePidFile) {
    $mobilePid = Get-Content $mobilePidFile -ErrorAction SilentlyContinue
    if ($mobilePid) {
        $mobileWindow = Get-Process -Id $mobilePid -ErrorAction SilentlyContinue
        if ($mobileWindow) {
            Write-Host "   [CLOSING] Mobile window (PID: $mobilePid)" -ForegroundColor Gray
            Stop-Process -Id $mobilePid -Force -ErrorAction SilentlyContinue
            $closedWindows++
        }
    }
    Remove-Item $mobilePidFile -Force -ErrorAction SilentlyContinue
}

if ($closedWindows -gt 0) {
    Write-Host "   [OK] Closed $closedWindows server window(s)" -ForegroundColor Green
}
else {
    Write-Host "   [INFO] No server windows found (or already closed)" -ForegroundColor Gray
}

# Stop Python processes (Backend)
Write-Host "[STOPPING] Backend processes..." -ForegroundColor Yellow
$pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    $pythonProcesses | Stop-Process -Force
    Write-Host "   [OK] Backend stopped ($($pythonProcesses.Count) Python process(es))" -ForegroundColor Green
}
else {
    Write-Host "   [INFO] No Backend processes running" -ForegroundColor Gray
}

# Stop Node processes (Frontend)
Write-Host "[STOPPING] Frontend/Mobile processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "   [OK] Frontend/Mobile stopped ($($nodeProcesses.Count) Node process(es))" -ForegroundColor Green
}
else {
    Write-Host "   [INFO] No Frontend/Mobile processes running" -ForegroundColor Gray
}

Write-Host "`n[SUCCESS] All services and windows stopped!`n" -ForegroundColor Green
