# Production Deployment Script for Windows
# This script deploys the Academic Portal API to production

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
}

# Navigate to backend directory
Set-Location "$PSScriptRoot"

# ==================== PRE-DEPLOYMENT CHECKS ====================

Write-Host "`n📋 Running pre-deployment checks..." -ForegroundColor Cyan

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Gray
$pythonVersion = python --version 2>&1
if ($pythonVersion -match "Python 3\.(1[0-2]|[8-9])") {
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
}
else {
    Write-Host "❌ Python 3.8+ required. Found: $pythonVersion" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Gray
try {
    $pgVersion = psql --version 2>&1
    Write-Host "✅ $pgVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ PostgreSQL not found or not in PATH" -ForegroundColor Red
    exit 1
}

# Check required environment files
Write-Host "Checking environment configuration..." -ForegroundColor Gray
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
}
else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   ⚠️  Please configure .env before continuing" -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "   ❌ .env.example not found" -ForegroundColor Red
        exit 1
    }
}

# Check Firebase credentials
Write-Host "Checking Firebase credentials..." -ForegroundColor Gray
if (Test-Path "credentials/serviceAccountKey.json") {
    Write-Host "✅ Firebase credentials found" -ForegroundColor Green
}
else {
    Write-Host "❌ Firebase credentials not found at credentials/serviceAccountKey.json" -ForegroundColor Red
    exit 1
}

# ==================== BACKUP DATABASE ====================

Write-Host "`n💾 Creating database backup..." -ForegroundColor Cyan

$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir/pre_deploy_backup_$timestamp.sql"

Write-Host "Backup location: $backupFile" -ForegroundColor Gray

# Read database config from .env
$dbHost = (Get-Content .env | Where-Object { $_ -match "^DATABASE_HOST=" }) -replace "DATABASE_HOST=", ""
$dbPort = (Get-Content .env | Where-Object { $_ -match "^DATABASE_PORT=" }) -replace "DATABASE_PORT=", ""
$dbName = (Get-Content .env | Where-Object { $_ -match "^DATABASE_NAME=" }) -replace "DATABASE_NAME=", ""
$dbUser = (Get-Content .env | Where-Object { $_ -match "^DATABASE_USER=" }) -replace "DATABASE_USER=", ""

# Default values if not found
if (-not $dbHost) { $dbHost = "localhost" }
if (-not $dbPort) { $dbPort = "5432" }
if (-not $dbName) { $dbName = "academic_portal" }
if (-not $dbUser) { $dbUser = "postgres" }

Write-Host "Database: $dbName on ${dbHost}:${dbPort}" -ForegroundColor Gray

try {
    $env:PGPASSWORD = (Get-Content .env | Where-Object { $_ -match "^DATABASE_PASSWORD=" }) -replace "DATABASE_PASSWORD=", ""
    pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile
    
    if (Test-Path $backupFile) {
        $backupSize = (Get-Item $backupFile).Length / 1KB
        Write-Host "✅ Backup created: $([math]::Round($backupSize, 2)) KB" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Backup failed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Database backup failed: $_" -ForegroundColor Red
    exit 1
}
finally {
    $env:PGPASSWORD = $null
}

# ==================== INSTALL DEPENDENCIES ====================

Write-Host "`n📦 Installing production dependencies..." -ForegroundColor Cyan

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "Virtual environment found, activating..." -ForegroundColor Gray
    .\venv\Scripts\Activate.ps1
}
else {
    Write-Host "Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
    .\venv\Scripts\Activate.ps1
}

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Gray
python -m pip install --upgrade pip --quiet

# Install dependencies
Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Gray
pip install -r requirements.txt --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}

# ==================== RUN DATABASE MIGRATIONS ====================

Write-Host "`n🔄 Running database migrations..." -ForegroundColor Cyan

try {
    alembic upgrade head
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Database migrations failed" -ForegroundColor Red
        Write-Host "   Restoring database from backup..." -ForegroundColor Yellow
        
        # Restore backup
        $env:PGPASSWORD = (Get-Content .env | Where-Object { $_ -match "^DATABASE_PASSWORD=" }) -replace "DATABASE_PASSWORD=", ""
        psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile
        $env:PGPASSWORD = $null
        
        exit 1
    }
}
catch {
    Write-Host "❌ Migration error: $_" -ForegroundColor Red
    exit 1
}

# ==================== RUN TESTS ====================

Write-Host "`n🧪 Running tests..." -ForegroundColor Cyan

if (Test-Path "tests") {
    pytest tests/ -v --tb=short
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        Write-Host "   Do you want to continue deployment? (y/N)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "   Deployment cancelled" -ForegroundColor Red
            exit 1
        }
    }
}
else {
    Write-Host "⚠️  No tests found, skipping..." -ForegroundColor Yellow
}

# ==================== BUILD & VALIDATE ====================

Write-Host "`n🔍 Validating application..." -ForegroundColor Cyan

# Test import
python -c "from app.main import app; print('✅ Application validated')"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Application validation failed" -ForegroundColor Red
    exit 1
}

# ==================== STOP EXISTING SERVICE ====================

Write-Host "`n🛑 Stopping existing service..." -ForegroundColor Cyan

# Stop any running uvicorn processes
$processes = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*uvicorn*app.main:app*"
}

if ($processes) {
    Write-Host "Found $($processes.Count) running process(es), stopping..." -ForegroundColor Gray
    $processes | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ Existing service stopped" -ForegroundColor Green
}
else {
    Write-Host "No existing service found" -ForegroundColor Gray
}

# ==================== START PRODUCTION SERVER ====================

Write-Host "`n🚀 Starting production server..." -ForegroundColor Cyan

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

$logFile = "logs/deploy_$timestamp.log"

Write-Host "Server logs: $logFile" -ForegroundColor Gray
Write-Host "Starting uvicorn with production settings..." -ForegroundColor Gray

# Start server in background
$serverJob = Start-Job -ScriptBlock {
    param($scriptPath, $logPath)
    Set-Location (Split-Path $scriptPath)
    .\venv\Scripts\Activate.ps1
    
    uvicorn app.main:app `
        --host 0.0.0.0 `
        --port 8000 `
        --workers 4 `
        --log-level info `
        --no-access-log `
        --proxy-headers `
        --forwarded-allow-ips='*' `
        2>&1 | Tee-Object -FilePath $logPath
} -ArgumentList $PSScriptRoot, $logFile

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Test server health
$maxRetries = 5
$retryCount = 0
$serverHealthy = $false

while ($retryCount -lt $maxRetries -and -not $serverHealthy) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5
        if ($response.status -eq "healthy") {
            $serverHealthy = $true
            Write-Host "✅ Server is healthy" -ForegroundColor Green
        }
    }
    catch {
        $retryCount++
        Write-Host "   Retry $retryCount/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serverHealthy) {
    Write-Host "❌ Server health check failed" -ForegroundColor Red
    Write-Host "   Check logs at: $logFile" -ForegroundColor Yellow
    
    # Stop the job
    Stop-Job -Job $serverJob
    Remove-Job -Job $serverJob
    
    exit 1
}

# ==================== DEPLOYMENT SUMMARY ====================

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Server URL:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs:       http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "📊 Health Check:   http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "📝 Logs:           $logFile" -ForegroundColor Cyan
Write-Host "💾 Backup:         $backupFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚙️  Configuration:" -ForegroundColor Yellow
Write-Host "   - Workers: 4" -ForegroundColor Gray
Write-Host "   - Host: 0.0.0.0" -ForegroundColor Gray
Write-Host "   - Port: 8000" -ForegroundColor Gray
Write-Host "   - Log Level: info" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test all critical endpoints" -ForegroundColor Gray
Write-Host "   2. Monitor server logs for errors" -ForegroundColor Gray
Write-Host "   3. Set up reverse proxy (nginx/IIS) if needed" -ForegroundColor Gray
Write-Host "   4. Configure SSL/TLS certificates" -ForegroundColor Gray
Write-Host "   5. Set up monitoring and alerting" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 To stop the server:" -ForegroundColor Yellow
Write-Host "   Stop-Job -Job `$serverJob; Remove-Job -Job `$serverJob" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

# Keep the server running
Write-Host "`nPress Ctrl+C to stop the server and exit..." -ForegroundColor Yellow

try {
    # Wait for the job to complete (it won't unless there's an error)
    Wait-Job -Job $serverJob | Out-Null
}
catch {
    Write-Host "`n🛑 Deployment interrupted" -ForegroundColor Yellow
}
finally {
    # Cleanup
    if ($serverJob) {
        Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
        Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
