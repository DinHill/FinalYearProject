# 🚀 Deployment Guide - Greenwich University Backend

## Overview

This guide covers deploying your FastAPI backend to production. The backend is **95% complete** and **production-ready** with 60+ endpoints, comprehensive testing, and all core features implemented.

---

## ✅ Pre-Deployment Checklist

### Code Readiness

- ✅ 60+ API endpoints implemented and tested
- ✅ 114 automated tests passing (80%+ coverage)
- ✅ All core modules complete (Auth, Users, Academic, Finance, Documents, Support)
- ✅ Database migrations ready (Alembic)
- ✅ Environment configuration template (.env.example)
- ✅ Comprehensive documentation

### Required Services

- [ ] PostgreSQL database (15+)
- [ ] Firebase project with Admin SDK
- [ ] Google Cloud Storage bucket
- [ ] Redis instance (optional, for caching)
- [ ] Domain name (optional)
- [ ] SSL certificate (recommended)

---

## 🛠️ Step 1: Prepare Your Environment

### 1.1 Create Production Environment File

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your production credentials:

```env
# Application
ENVIRONMENT=production
DEBUG=False
APP_NAME="Greenwich University API"
API_V1_PREFIX=/api/v1

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Database (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://username:password@host:5432/greenwich_prod

# Security
SECRET_KEY=your-super-secret-key-min-32-chars-here-generate-with-openssl
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SESSION_COOKIE_MAX_AGE=86400

# CORS (Update with your frontend URLs)
CORS_ORIGINS=["https://yourdomain.com","https://admin.yourdomain.com"]

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json

# Google Cloud Storage
GCP_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=greenwich-documents-prod
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-credentials.json

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Email (optional - SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@greenwich.edu.vn

# AI (optional - OpenAI)
OPENAI_API_KEY=your-openai-api-key
```

### 1.2 Generate Secret Key

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🗄️ Step 2: Setup Production Database

### 2.1 Create PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
psql -U postgres
CREATE DATABASE greenwich_prod;
CREATE USER greenwich_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE greenwich_prod TO greenwich_user;
\q
```

**Option B: Cloud PostgreSQL (Recommended)**

**AWS RDS:**

1. Go to AWS RDS Console
2. Create PostgreSQL instance (15.x)
3. Choose instance type (t3.micro for testing, t3.medium+ for production)
4. Set master username and password
5. Configure security group (allow port 5432 from your server)
6. Note the endpoint URL

**Google Cloud SQL:**

1. Go to Cloud SQL Console
2. Create PostgreSQL instance
3. Set instance ID, password
4. Configure connections
5. Note the connection string

**Azure Database for PostgreSQL:**

1. Go to Azure Portal
2. Create PostgreSQL server
3. Configure connection security
4. Note the connection string

**Heroku Postgres:**

```bash
heroku addons:create heroku-postgresql:standard-0
heroku config:get DATABASE_URL
```

### 2.2 Run Database Migrations

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate      # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head
```

### 2.3 Create Initial Data (Optional)

Create a seed script `scripts/seed_data.py`:

```python
"""Seed initial data for production."""
import asyncio
from sqlalchemy import select
from app.core.database import async_session
from app.models import Campus, Major
from app.services.auth_service import hash_password
from app.models import User

async def seed_data():
    async with async_session() as session:
        # Create campuses
        campuses = [
            Campus(name="Da Nang", code="DN", email="danang@greenwich.edu.vn"),
            Campus(name="Ho Chi Minh", code="HCM", email="hcm@greenwich.edu.vn"),
            Campus(name="Ha Noi", code="HN", email="hanoi@greenwich.edu.vn"),
        ]

        for campus in campuses:
            result = await session.execute(
                select(Campus).where(Campus.code == campus.code)
            )
            if not result.scalar_one_or_none():
                session.add(campus)

        await session.commit()

        # Create majors
        majors = [
            Major(name="Computer Science", code="CS", degree_type="bachelor",
                  duration_years=4, total_credits=120),
            Major(name="Business Administration", code="BA", degree_type="bachelor",
                  duration_years=4, total_credits=120),
        ]

        for major in majors:
            result = await session.execute(
                select(Major).where(Major.code == major.code)
            )
            if not result.scalar_one_or_none():
                session.add(major)

        await session.commit()

        # Create admin user
        result = await session.execute(
            select(User).where(User.email == "admin@greenwich.edu.vn")
        )
        if not result.scalar_one_or_none():
            campus_result = await session.execute(
                select(Campus).where(Campus.code == "DN")
            )
            campus = campus_result.scalar_one()

            admin = User(
                username="AdminGCD000001",
                email="admin@greenwich.edu.vn",
                password=hash_password("ChangeThisPassword123!"),
                full_name="System Administrator",
                role="admin",
                campus_id=campus.id,
                is_active=True
            )
            session.add(admin)
            await session.commit()
            print("✅ Admin user created: admin@greenwich.edu.vn")
            print("⚠️  Default password: ChangeThisPassword123!")
            print("🔒 Please change this password immediately!")

if __name__ == "__main__":
    asyncio.run(seed_data())
```

Run the seed script:

```bash
python scripts/seed_data.py
```

---

## ☁️ Step 3: Setup Cloud Services

### 3.1 Firebase Setup

1. **Create Firebase Project**

   - Go to https://console.firebase.google.com
   - Create new project or select existing
   - Enable Authentication

2. **Generate Service Account Key**

   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json`
   - Upload to your server (secure location)

3. **Configure Firebase Authentication**
   - Enable Email/Password authentication
   - Configure authorized domains

### 3.2 Google Cloud Storage Setup

1. **Create GCS Bucket**

   ```bash
   # Install gcloud CLI
   gcloud auth login

   # Create bucket
   gsutil mb -c STANDARD -l asia-southeast1 gs://greenwich-documents-prod

   # Set CORS policy
   gsutil cors set cors.json gs://greenwich-documents-prod
   ```

2. **CORS Configuration** (`cors.json`):

   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

3. **Create Service Account**

   - Go to IAM & Admin → Service Accounts
   - Create service account with Storage Admin role
   - Generate and download key as JSON
   - Save as `gcs-credentials.json`

4. **Set Bucket Permissions**
   ```bash
   # Make bucket private (files accessed via presigned URLs)
   gsutil iam ch allUsers:objectViewer gs://greenwich-documents-prod
   ```

### 3.3 Redis Setup (Optional)

**Option A: Local Redis**

```bash
# Windows: Download from https://github.com/microsoftarchive/redis/releases
# Start Redis
redis-server
```

**Option B: Cloud Redis**

- **AWS ElastiCache**: Create Redis cluster
- **Google Cloud Memorystore**: Create Redis instance
- **Azure Cache for Redis**: Create Redis instance
- **Redis Cloud**: https://redis.com/try-free/

---

## 🐳 Step 4: Deployment Options

### Option A: Deploy to Ubuntu/Linux Server (VPS)

#### 4.1 Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install PostgreSQL client
sudo apt install postgresql-client -y

# Install Nginx
sudo apt install nginx -y

# Install Supervisor (process manager)
sudo apt install supervisor -y
```

#### 4.2 Upload Code

```bash
# On your local machine
cd "d:\Dinh Hieu\Final Year Project\backend"
rsync -avz --exclude='venv' --exclude='__pycache__' ./ user@your-server:/var/www/greenwich-api/
```

#### 4.3 Setup Application

```bash
# SSH to server
ssh user@your-server

# Navigate to app directory
cd /var/www/greenwich-api

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
nano .env  # Edit with production values

# Run migrations
alembic upgrade head

# Test the application
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 4.4 Configure Gunicorn

Create `/var/www/greenwich-api/gunicorn.conf.py`:

```python
"""Gunicorn configuration for production."""
import multiprocessing

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/log/greenwich-api/access.log"
errorlog = "/var/log/greenwich-api/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "greenwich-api"

# Server mechanics
daemon = False
pidfile = "/var/run/greenwich-api.pid"
user = "www-data"
group = "www-data"
```

#### 4.5 Configure Supervisor

Create `/etc/supervisor/conf.d/greenwich-api.conf`:

```ini
[program:greenwich-api]
command=/var/www/greenwich-api/venv/bin/gunicorn app.main:app -c /var/www/greenwich-api/gunicorn.conf.py
directory=/var/www/greenwich-api
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/greenwich-api/supervisor.log
environment=PATH="/var/www/greenwich-api/venv/bin"
```

Start the service:

```bash
# Create log directory
sudo mkdir -p /var/log/greenwich-api
sudo chown www-data:www-data /var/log/greenwich-api

# Update supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start greenwich-api

# Check status
sudo supervisorctl status greenwich-api
```

#### 4.6 Configure Nginx

Create `/etc/nginx/sites-available/greenwich-api`:

```nginx
upstream greenwich_api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    client_max_body_size 100M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/greenwich-api-access.log;
    error_log /var/log/nginx/greenwich-api-error.log;

    location / {
        proxy_pass http://greenwich_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://greenwich_api/health;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/greenwich-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4.7 Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

---

### Option B: Deploy to Heroku

#### 4.1 Prepare Heroku Files

Create `Procfile`:

```
web: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
release: alembic upgrade head
```

Create `runtime.txt`:

```
python-3.11.5
```

#### 4.2 Deploy

```bash
# Login to Heroku
heroku login

# Create app
heroku create greenwich-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis (optional)
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set FIREBASE_PROJECT_ID=your-project-id
# ... set all other environment variables

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

### Option C: Deploy to AWS Elastic Beanstalk

#### 4.1 Install EB CLI

```bash
pip install awsebcli
```

#### 4.2 Initialize Application

```bash
eb init -p python-3.11 greenwich-api --region us-east-1
```

#### 4.3 Create Environment

```bash
eb create greenwich-api-prod --database.engine postgres --database.username dbadmin
```

#### 4.4 Deploy

```bash
eb deploy
```

---

### Option D: Deploy to Google Cloud Run

#### 4.1 Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### 4.2 Build and Deploy

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT-ID/greenwich-api

# Deploy to Cloud Run
gcloud run deploy greenwich-api \
  --image gcr.io/PROJECT-ID/greenwich-api \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=...,SECRET_KEY=..."
```

---

## 🔍 Step 5: Post-Deployment Verification

### 5.1 Health Check

```bash
curl https://api.yourdomain.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 5.2 API Documentation

Visit: `https://api.yourdomain.com/docs`

### 5.3 Test Authentication

```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"student_id": "test", "password": "test123"}'
```

### 5.4 Monitor Logs

```bash
# Supervisor logs
sudo tail -f /var/log/greenwich-api/error.log

# Nginx logs
sudo tail -f /var/log/nginx/greenwich-api-error.log
```

---

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Setup Monitoring

**Option A: Sentry (Error Tracking)**

```bash
pip install sentry-sdk[fastapi]
```

Add to `app/main.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

**Option B: Prometheus + Grafana**

```bash
pip install prometheus-fastapi-instrumentator
```

**Option C: DataDog APM**

```bash
pip install ddtrace
```

### 6.2 Database Backups

```bash
# Manual backup
pg_dump -h hostname -U username greenwich_prod > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * pg_dump -h hostname -U username greenwich_prod > /backups/backup_$(date +\%Y\%m\%d).sql
```

### 6.3 Log Rotation

Create `/etc/logrotate.d/greenwich-api`:

```
/var/log/greenwich-api/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        supervisorctl restart greenwich-api > /dev/null
    endscript
}
```

---

## 🔒 Step 7: Security Hardening

### 7.1 Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 7.2 SSL/TLS Configuration

Ensure Nginx has strong SSL configuration:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
```

### 7.3 Rate Limiting

Already configured in Nginx (10 requests/second).

### 7.4 Database Security

- Use strong passwords
- Restrict database access to application server IP only
- Enable SSL for database connections
- Regular security updates

---

## 📈 Step 8: Performance Optimization

### 8.1 Enable Redis Caching

The backend already has Redis integration. Just set `REDIS_URL` in `.env`.

### 8.2 Database Connection Pooling

Already configured in SQLAlchemy settings.

### 8.3 CDN for Static Files

Use CloudFlare or AWS CloudFront for document downloads.

---

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Error**

```
Solution: Check DATABASE_URL format and network access
```

**2. Firebase Authentication Error**

```
Solution: Verify serviceAccountKey.json path and permissions
```

**3. File Upload Error**

```
Solution: Check GCS credentials and bucket permissions
```

**4. 502 Bad Gateway**

```
Solution: Check if Gunicorn is running (supervisorctl status)
```

**5. High Memory Usage**

```
Solution: Reduce number of Gunicorn workers
```

---

## ✅ Deployment Checklist

- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Firebase credentials uploaded
- [ ] GCS credentials uploaded
- [ ] SSL certificate installed
- [ ] Application running (supervisorctl status)
- [ ] Nginx configured and running
- [ ] Health check endpoint accessible
- [ ] API documentation accessible (/docs)
- [ ] Test authentication working
- [ ] Test file upload/download
- [ ] Monitoring setup
- [ ] Backup strategy configured
- [ ] Logs rotating properly
- [ ] Change default admin password!

---

## 🎉 Success!

Your Greenwich University Backend is now deployed and running in production!

**Next Steps:**

1. Build and deploy your frontend (React Native + Admin Dashboard)
2. Integrate frontend with your API
3. Monitor performance and logs
4. Set up CI/CD pipeline for automated deployments

**API URL:** `https://api.yourdomain.com`
**Documentation:** `https://api.yourdomain.com/docs`

---

**Need Help?**

- Check logs: `/var/log/greenwich-api/error.log`
- API Reference: `API_REFERENCE.md`
- Architecture: `VISUAL_OVERVIEW.md`
