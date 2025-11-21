# Greenwich Academic Portal - Start All Services
# This script starts Backend (FastAPI), Admin Dashboard (Next.js), and Mobile App (Expo) in separate windows

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Greenwich Academic Portal Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootDir = $PSScriptRoot

# Check if Python virtual environment exists
$venvPath = Join-Path $rootDir "backend\venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvPath)) {
    Write-Host "[ERROR] Backend virtual environment not found!" -ForegroundColor Red
    Write-Host "   Please set up the backend first:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   python -m venv venv" -ForegroundColor Yellow
    Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    Write-Host "   pip install -r requirements.txt`n" -ForegroundColor Yellow
    exit 1
}

# Check if admin node_modules exists
$adminNodeModulesPath = Join-Path $rootDir "academic-portal-admin\node_modules"
if (-not (Test-Path $adminNodeModulesPath)) {
    Write-Host "[ERROR] Admin dashboard dependencies not installed!" -ForegroundColor Red
    Write-Host "   Please install admin dependencies:" -ForegroundColor Yellow
    Write-Host "   cd academic-portal-admin" -ForegroundColor Yellow
    Write-Host "   npm install`n" -ForegroundColor Yellow
    exit 1
}

# Check if mobile node_modules exists
$mobileNodeModulesPath = Join-Path $rootDir "academic-portal-app\node_modules"
if (-not (Test-Path $mobileNodeModulesPath)) {
    Write-Host "[ERROR] Mobile app dependencies not installed!" -ForegroundColor Red
    Write-Host "   Please install mobile dependencies:" -ForegroundColor Yellow
    Write-Host "   cd academic-portal-app" -ForegroundColor Yellow
    Write-Host "   npm install`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Prerequisites check passed`n" -ForegroundColor Green

# Get local IP address for mobile connection info
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.InterfaceAlias -match "Wi-Fi|Wireless|WLAN|Ethernet" } |
    Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "your-local-ip"
}

Write-Host "[INFO] Local IP Address: $localIP" -ForegroundColor Cyan
Write-Host "       Make sure your .env has: EXPO_PUBLIC_API_URL=http://${localIP}:8000`n" -ForegroundColor White

# Start Backend in new PowerShell window
Write-Host "[STARTING] Backend Server (FastAPI)..." -ForegroundColor Yellow
$backendCmd = "cd '$rootDir\backend'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host 'BACKEND SERVER (FastAPI)' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host 'Port: 8000' -ForegroundColor White; Write-Host 'API Docs: http://localhost:8000/docs' -ForegroundColor White; Write-Host 'Health: http://localhost:8000/api/v1/health' -ForegroundColor White; Write-Host '========================================`n' -ForegroundColor Cyan; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru
$backendProcess.Id | Out-File "$rootDir\.backend_pid.txt" -Force

Start-Sleep -Seconds 3

# Start Admin Dashboard in new PowerShell window
Write-Host "[STARTING] Admin Dashboard (Next.js)..." -ForegroundColor Yellow
$adminCmd = "cd '$rootDir\academic-portal-admin'; Write-Host '========================================' -ForegroundColor Green; Write-Host 'ADMIN DASHBOARD (Next.js)' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host 'Local: http://localhost:3000' -ForegroundColor White; Write-Host 'Network: http://${localIP}:3000' -ForegroundColor Yellow; Write-Host '========================================`n' -ForegroundColor Green; npm run dev"

$adminProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $adminCmd -PassThru
$adminProcess.Id | Out-File "$rootDir\.admin_pid.txt" -Force

Start-Sleep -Seconds 2

# Start Mobile App in new PowerShell window
Write-Host "[STARTING] Mobile App (Expo)..." -ForegroundColor Yellow
$mobileCmd = "cd '$rootDir\academic-portal-app'; Write-Host '========================================' -ForegroundColor Magenta; Write-Host 'MOBILE APP (Expo)' -ForegroundColor Magenta; Write-Host '========================================' -ForegroundColor Magenta; Write-Host 'Scan QR code with Expo Go app' -ForegroundColor White; Write-Host 'Or press ''a'' for Android emulator' -ForegroundColor White; Write-Host 'Or press ''i'' for iOS simulator' -ForegroundColor White; Write-Host '========================================`n' -ForegroundColor Magenta; npm start"

$mobileProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $mobileCmd -PassThru
$mobileProcess.Id | Out-File "$rootDir\.mobile_pid.txt" -Force

Start-Sleep -Seconds 1

Write-Host "`n[SUCCESS] All services started successfully!" -ForegroundColor Green
Write-Host "`nQuick Access:" -ForegroundColor Cyan
Write-Host "   Backend (Local):   http://localhost:8000" -ForegroundColor White
Write-Host "   Backend (Network): http://${localIP}:8000" -ForegroundColor Yellow
Write-Host "   API Docs:          http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Admin Dashboard:   http://localhost:3000" -ForegroundColor White
Write-Host "   Mobile:            Scan QR code in Expo window`n" -ForegroundColor White

Write-Host "Mobile Device Connection:" -ForegroundColor Cyan
Write-Host "   Physical Device: Use http://${localIP}:8000 (same Wi-Fi)" -ForegroundColor White
Write-Host "   Android Emulator: Use http://10.0.2.2:8000" -ForegroundColor White
Write-Host "   iOS Simulator: Use http://localhost:8000`n" -ForegroundColor White

Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "   Super Admin:    super_admin / Admin@123" -ForegroundColor White
Write-Host "   Academic Admin: academic_admin_h / Admin@123" -ForegroundColor White
Write-Host "   Student:        HieuNDGCD220001 / Student@123" -ForegroundColor White
Write-Host "   Teacher:        TuanNV1 / Teacher@123`n" -ForegroundColor White

Write-Host "[INFO] Press Ctrl+C in each window to stop" -ForegroundColor Yellow
Write-Host "       Or run: .\stop-all.ps1`n" -ForegroundColor Yellow
