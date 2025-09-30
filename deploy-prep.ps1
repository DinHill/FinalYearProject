# Deployment Preparation Script for Windows

Write-Host "🚀 Preparing Academic Portal for Deployment..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit - Academic Portal"
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "📝 Creating .gitignore..." -ForegroundColor Yellow
    @"
# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
env/

# Database
*.db
*.sqlite3

# Environment variables
.env
.env.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Build outputs
.next/
dist/
build/

# Runtime
.vercel
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

Write-Host "✅ Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push to GitHub: git remote add origin YOUR_REPO_URL" -ForegroundColor White
Write-Host "   Then: git push -u origin main" -ForegroundColor White
Write-Host "2. Deploy backend to Render: https://render.com" -ForegroundColor White
Write-Host "3. Deploy frontend to Vercel: https://vercel.com" -ForegroundColor White
Write-Host "4. Update environment variables with your deployed URLs" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Magenta