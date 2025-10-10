# 🚀 Deployment Guide

## Production Deployment Checklist

This guide covers deploying the Greenwich Academic Portal backend to production.

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
- [ ] No console.log/debug statements
- [ ] Environment variables externalized
- [ ] Error handling comprehensive
- [ ] Security best practices followed

### Configuration

- [ ] `.env` file configured for production
- [ ] Database connection string (production)
- [ ] Firebase credentials (production project)
- [ ] GCS bucket configured
- [ ] CORS origins set correctly
- [ ] `DEBUG=False` in production

### Database

- [ ] Migrations created and tested
- [ ] Seed data script ready
- [ ] Backup strategy planned
- [ ] Connection pooling configured

### Security

- [ ] Strong `SECRET_KEY` generated
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (via ORM)
- [ ] XSS prevention (via Pydantic)

---

## Option 1: Docker Deployment (Recommended)

### 1.1 Create Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 1.2 Create docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:${DB_PASSWORD}@db:5432/greenwich_db
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - GCS_BUCKET_NAME=${GCS_BUCKET_NAME}
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
      - LOG_LEVEL=INFO
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=greenwich_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 1.3 Build and Run

```bash
# Build image
docker build -t greenwich-backend .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend alembic upgrade head

# Seed data
docker-compose exec backend python scripts/seed_data.py
```

---

## Option 2: Cloud Platform Deployment

### 2.1 Google Cloud Platform (GCP)

#### Deploy to Cloud Run

```bash
# Build and push image to GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/greenwich-backend

# Deploy to Cloud Run
gcloud run deploy greenwich-backend \
  --image gcr.io/YOUR_PROJECT_ID/greenwich-backend \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="postgresql+asyncpg://..." \
  --set-env-vars FIREBASE_PROJECT_ID="..." \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2
```

#### Setup Cloud SQL (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create greenwich-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=asia-southeast1

# Create database
gcloud sql databases create greenwich_db --instance=greenwich-db

# Get connection string
gcloud sql instances describe greenwich-db --format="value(connectionName)"
```

### 2.2 AWS

#### Deploy to Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p python-3.11 greenwich-backend --region ap-southeast-1

# Create environment
eb create greenwich-prod --envvars \
  DATABASE_URL="postgresql+asyncpg://..." \
  FIREBASE_PROJECT_ID="..." \
  SECRET_KEY="..."

# Deploy
eb deploy

# Open application
eb open
```

#### Setup RDS (PostgreSQL)

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier greenwich-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --region ap-southeast-1
```

### 2.3 Azure

#### Deploy to App Service

```bash
# Login
az login

# Create resource group
az group create --name greenwich-rg --location southeastasia

# Create App Service plan
az appservice plan create \
  --name greenwich-plan \
  --resource-group greenwich-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --resource-group greenwich-rg \
  --plan greenwich-plan \
  --name greenwich-backend \
  --runtime "PYTHON:3.11"

# Configure environment variables
az webapp config appsettings set \
  --resource-group greenwich-rg \
  --name greenwich-backend \
  --settings DATABASE_URL="..." FIREBASE_PROJECT_ID="..."

# Deploy code
az webapp up --name greenwich-backend --resource-group greenwich-rg
```

---

## Database Migration Strategy

### Production Migration Process

```bash
# 1. Backup database
pg_dump -U postgres greenwich_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on staging
alembic upgrade head --sql > migration.sql
# Review SQL before applying

# 3. Apply migration
alembic upgrade head

# 4. Verify migration
alembic current

# 5. Rollback if needed
alembic downgrade -1
```

### Zero-Downtime Migration

For production with no downtime:

1. **Additive changes only** - Don't drop columns immediately
2. **Deploy new code** - Compatible with old and new schema
3. **Run migration** - Add new columns/tables
4. **Monitor** - Ensure no errors
5. **Cleanup** - Remove old columns after 1 week

---

## Environment Variables (Production)

### Required Variables

```env
# Application
APP_NAME=Greenwich Academic Portal API
APP_ENV=production
DEBUG=False
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO

# Database (Cloud SQL/RDS)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/greenwich_db

# Firebase (Production Project)
FIREBASE_PROJECT_ID=greenwich-prod
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@greenwich-prod.iam.gserviceaccount.com

# Google Cloud Storage
GCS_BUCKET_NAME=greenwich-prod-documents

# OpenAI
OPENAI_API_KEY=sk-...

# Redis (Cloud)
REDIS_URL=redis://redis-cloud-host:6379/0

# SendGrid
SENDGRID_API_KEY=SG...

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (Production domains)
CORS_ORIGINS=https://portal.greenwich.edu.vn,https://app.greenwich.edu.vn

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

### Generate Secure SECRET_KEY

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Monitoring & Logging

### Setup Application Logging

```python
# Already configured in app/core/settings.py
LOG_LEVEL=INFO  # production
LOG_LEVEL=DEBUG  # development
```

### Cloud Logging

**GCP:**

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**AWS:**

```bash
# View logs
eb logs

# Or CloudWatch
aws logs tail /aws/elasticbeanstalk/greenwich-backend/var/log/eb-engine.log
```

### Health Checks

Setup monitoring for:

- `/health` endpoint (every 30s)
- `/api/v1/health` endpoint
- Database connectivity
- Firebase connectivity

**Example monitoring script:**

```bash
#!/bin/bash
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.greenwich.edu.vn/health)
  if [ $STATUS -ne 200 ]; then
    echo "Health check failed: $STATUS"
    # Send alert
  fi
  sleep 30
done
```

---

## Performance Optimization

### 1. Database Connection Pooling

Already configured in `app/core/database.py`:

```python
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,          # Keep 5 connections
    max_overflow=10,      # Allow 10 extra
    pool_pre_ping=True,   # Test connections
    pool_recycle=3600     # Recycle after 1 hour
)
```

### 2. Increase Workers

```bash
# Production: 2-4 workers per CPU core
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

### 3. Enable Redis Caching

```python
# Add to app/core/cache.py (to be implemented)
from redis import asyncio as aioredis

cache = aioredis.from_url(settings.REDIS_URL)
```

### 4. CDN for Static Assets

Use CloudFlare/CloudFront for:

- API docs (`/api/docs`)
- Static files
- Images from GCS

---

## Backup Strategy

### Database Backups

**Automated daily backups:**

```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres -h localhost greenwich_db | gzip > backups/greenwich_db_$DATE.sql.gz

# Keep only last 30 days
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

**Cron job:**

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup_db.sh
```

### Cloud Backups

**GCP Cloud SQL:**

```bash
gcloud sql backups create --instance=greenwich-db
```

**AWS RDS:**

```bash
aws rds create-db-snapshot \
  --db-instance-identifier greenwich-db \
  --db-snapshot-identifier greenwich-backup-$(date +%Y%m%d)
```

---

## Security Hardening

### 1. HTTPS Only

```python
# In app/main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if not settings.DEBUG:
    app.add_middleware(HTTPSRedirectMiddleware)
```

### 2. Rate Limiting

```python
# To be implemented with Redis
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/users")
@limiter.limit("60/minute")
async def list_users():
    ...
```

### 3. Security Headers

```python
# Add to app/main.py
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

### 4. Regular Updates

```bash
# Update dependencies monthly
pip list --outdated
pip install -U package_name
```

---

## Troubleshooting Production Issues

### High CPU Usage

- Check for N+1 queries (use `selectinload`)
- Add database indexes
- Increase workers
- Enable Redis caching

### Memory Leaks

- Monitor with `docker stats`
- Check for unclosed database sessions
- Review background tasks

### Slow Queries

```bash
# Enable PostgreSQL slow query log
ALTER DATABASE greenwich_db SET log_min_duration_statement = 1000;

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Connection Pool Exhausted

```python
# Increase pool size
pool_size=10
max_overflow=20
```

---

## Rollback Plan

If deployment fails:

1. **Immediate rollback:**

   ```bash
   # Docker
   docker-compose down
   git checkout previous-tag
   docker-compose up -d

   # Cloud Run
   gcloud run services update-traffic greenwich-backend \
     --to-revisions PREVIOUS_REVISION=100
   ```

2. **Database rollback:**

   ```bash
   alembic downgrade -1
   ```

3. **Restore from backup:**
   ```bash
   psql -U postgres greenwich_db < backup_YYYYMMDD_HHMMSS.sql
   ```

---

## Post-Deployment Verification

### Checklist

- [ ] Health check passes: `curl https://api.greenwich.edu.vn/health`
- [ ] API docs accessible: `https://api.greenwich.edu.vn/api/docs`
- [ ] Student login works
- [ ] Admin login works
- [ ] Database queries fast (< 100ms)
- [ ] No error logs
- [ ] Monitoring alerts configured

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://api.greenwich.edu.vn/health

# Using Locust
pip install locust
locust -f load_test.py --host https://api.greenwich.edu.vn
```

---

## Success! 🎉

Your backend is now deployed to production and ready to serve thousands of users!

**Next steps:**

1. Connect frontend applications
2. Setup monitoring dashboards
3. Configure alerts for critical errors
4. Document API for developers
5. Train support staff

**Support:**

- Monitor logs daily
- Review metrics weekly
- Update dependencies monthly
- Backup database daily
