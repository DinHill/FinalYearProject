# Start Both Backend and Frontend Servers
# Run this script from the backend directory

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "🚀 Starting Academic Portal Services" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Start Backend Server
Write-Host "📡 Starting Backend Server (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding; " +
    "cd 'd:\Dinh Hieu\Final Year Project\backend'; " +
    ".\venv\Scripts\Activate.ps1; " +
    "Write-Host '`n🚀 Backend Server Starting...' -ForegroundColor Green; " +
    "Write-Host '📍 URL: http://localhost:8000' -ForegroundColor Yellow; " +
    "Write-Host '📖 Docs: http://localhost:8000/docs`n' -ForegroundColor Yellow; " +
    "uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
)

Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd 'd:\Dinh Hieu\Final Year Project\academic-portal-admin'; " +
    "Write-Host '`n🎨 Frontend Server Starting...' -ForegroundColor Cyan; " +
    "Write-Host '📍 URL: http://localhost:3000' -ForegroundColor Yellow; " +
    "Write-Host '🔐 Login: http://localhost:3000/login`n' -ForegroundColor Yellow; " +
    "npm run dev"
)

Start-Sleep -Seconds 3

Write-Host "`n✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "`n📝 Login Credentials:" -ForegroundColor Yellow
Write-Host "   Super Admin:    super_admin / Test123!@#" -ForegroundColor White
Write-Host "   Academic Admin: academic_admin / Test123!@#" -ForegroundColor White
Write-Host "   Student:        HieuNDGCD220001 / Test123!@#" -ForegroundColor White
Write-Host "   Teacher:        teacher1 / Test123!@#" -ForegroundColor White

Write-Host "`n🌐 Access URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000/login" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:8000/docs" -ForegroundColor Green

Write-Host "`n⚠️  Note: It may take 10-20 seconds for servers to fully start" -ForegroundColor DarkYellow
Write-Host "========================================`n" -ForegroundColor Magenta
