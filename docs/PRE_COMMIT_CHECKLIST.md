# 📋 Pre-Commit Checklist

Use this checklist before committing code to ensure quality and consistency.

---

## ✅ Before Committing

### 1. Code Quality

- [ ] Code follows project style guidelines
- [ ] No commented-out code (remove or explain)
- [ ] No console.log() or print() debug statements
- [ ] No hardcoded credentials or API keys
- [ ] Proper error handling in place

### 2. Files & Cleanup

- [ ] No temporary files included (.pyc, .log, .backup)
- [ ] No sensitive data in commit (.env files excluded)
- [ ] No large files (>10MB) unless necessary
- [ ] Removed unused imports
- [ ] Removed unused variables

### 3. Documentation

- [ ] Code comments for complex logic
- [ ] API changes documented in API_ENDPOINTS.md
- [ ] README updated if setup changed
- [ ] New features documented

### 4. Testing

- [ ] Code runs without errors
- [ ] Tested in development environment
- [ ] No breaking changes to existing features
- [ ] API endpoints tested manually

### 5. Git Best Practices

- [ ] Commit message is clear and descriptive
- [ ] Changes are atomic (one feature/fix per commit)
- [ ] .gitignore is up to date
- [ ] No merge conflicts

---

## 🚀 Commit Message Format

Use this format for commit messages:

```
<type>: <short description>

<optional detailed description>

<optional footer>
```

### Types:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Formatting, missing semicolons, etc.
- **refactor**: Code restructuring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples:

```
feat: Add push notification support to mobile app

- Implemented Expo push notifications
- Added token registration endpoint
- Created notification handler
```

```
fix: Resolve attendance date field error in dashboard

Changed Attendance.attendance_date to Attendance.date
to match model definition
```

```
docs: Update API documentation with new endpoints

Added documentation for analytics endpoints:
- /api/v1/dashboard/analytics/user-activity
- /api/v1/dashboard/analytics/enrollment-trends
- /api/v1/dashboard/analytics/revenue
```

---

## 🧹 Quick Cleanup Commands

Before committing, run:

```powershell
# Run cleanup script
.\cleanup-project.ps1

# Check what will be committed
git status

# Review changes
git diff
```

---

## 📦 What Should NOT Be Committed

### Never Commit:

- `.env` files (contains secrets)
- `node_modules/` (installed dependencies)
- `__pycache__/` (Python cache)
- `.next/` (Next.js build)
- `.expo/` (Expo cache)
- `*.log` files
- `*.pid` files
- Database files (`*.db`, `*.sqlite3`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)

### Verify `.gitignore`:

These should all be in your `.gitignore` file.

---

## 🔍 Pre-Push Checklist

Before pushing to GitHub:

### 1. Security Review

- [ ] No API keys or secrets in code
- [ ] No passwords in comments or strings
- [ ] Firebase config in environment variables only
- [ ] Database URLs not hardcoded

### 2. Code Review

- [ ] All features working as expected
- [ ] No breaking changes without documentation
- [ ] Backward compatibility maintained

### 3. Documentation

- [ ] CHANGELOG updated (if exists)
- [ ] README accurate
- [ ] API documentation current

### 4. Branch Management

- [ ] On correct branch
- [ ] Branch is up to date with main/master
- [ ] No uncommitted changes

---

## 📝 Initial Commit Checklist

For the first push to GitHub:

- [ ] `.gitignore` file configured
- [ ] README.md is complete
- [ ] All documentation files reviewed
- [ ] Temporary/test files removed
- [ ] No sensitive data in repository
- [ ] License file added (if applicable)
- [ ] Project structure is clean

### Commands for Initial Commit:

```powershell
# Initialize git (if not already done)
git init

# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: Academic Portal System

- Backend API with FastAPI
- Admin portal with Next.js
- Mobile app with React Native
- Complete documentation
- Multi-campus support
- Role-based access control
"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/academic-portal.git

# Push to GitHub
git push -u origin main
```

---

## 🎯 GitHub Repository Setup

### 1. Create Repository on GitHub

- Go to github.com/new
- Name: `academic-portal` (or your preferred name)
- Description: Academic Portal Management System
- Choose public or private
- Don't initialize with README (you already have one)

### 2. Configure Repository

- Add topics/tags: `education`, `academic-management`, `fastapi`, `nextjs`, `react-native`
- Add license (if applicable)
- Configure branch protection (optional)

### 3. After First Push

- Verify all files uploaded correctly
- Check that .env files were NOT uploaded
- Verify README displays correctly
- Add collaborators if needed

---

## ⚠️ Common Mistakes to Avoid

1. **Committing .env files** - Always double-check!
2. **Large node_modules/** - Should be in .gitignore
3. **Database files** - Should be in .gitignore
4. **Build artifacts** - .next/, dist/, build/
5. **Cache files** - **pycache**/, .pytest_cache/
6. **Temporary files** - _.log, _.pid, \*.backup

---

## 🔄 Regular Maintenance

### Daily:

- [ ] Pull latest changes: `git pull`
- [ ] Commit frequently with clear messages
- [ ] Push working code at end of day

### Weekly:

- [ ] Review and update documentation
- [ ] Clean up old branches
- [ ] Update dependencies if needed

### Before Major Release:

- [ ] Full system test
- [ ] Documentation review
- [ ] Update version numbers
- [ ] Create release tag

---

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [.gitignore Templates](https://github.com/github/gitignore)

---

**Remember:** Good commit practices make collaboration easier and project history clearer!
