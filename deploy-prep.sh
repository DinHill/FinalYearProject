#!/bin/bash

# Deployment Preparation Script

echo "🚀 Preparing Academic Portal for Deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Academic Portal"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOL
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
EOL
fi

echo "✅ Ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git remote add origin YOUR_REPO_URL && git push -u origin main"
echo "2. Deploy backend to Render: https://render.com"
echo "3. Deploy frontend to Vercel: https://vercel.com"
echo "4. Update environment variables with your deployed URLs"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"