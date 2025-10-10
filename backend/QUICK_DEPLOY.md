# ⚡ Quick Deployment Checklist

## Before You Deploy

### 1. Required Services Setup

```
[ ] PostgreSQL database (15+)
    - Create database: greenwich_prod
    - Create user with permissions
    - Note connection string

[ ] Firebase Project
    - Enable Authentication (Email/Password)
    - Generate Service Account Key
    - Download serviceAccountKey.json

[ ] Google Cloud Storage
    - Create bucket (e.g., greenwich-documents-prod)
    - Configure CORS
    - Create Service Account with Storage Admin role
    - Download credentials JSON

[ ] Domain Name (optional)
    - Purchase domain
    - Configure DNS A record to server IP
```

### 2. Environment Configuration

```
[ ] Copy .env.example to .env
[ ] Generate SECRET_KEY (min 32 chars)
[ ] Set DATABASE_URL (PostgreSQL connection)
[ ] Set FIREBASE_PROJECT_ID
[ ] Set FIREBASE_CREDENTIALS_PATH
[ ] Set GCP_PROJECT_ID
[ ] Set GCS_BUCKET_NAME
[ ] Set GOOGLE_APPLICATION_CREDENTIALS
[ ] Configure CORS_ORIGINS with your frontend URLs
[ ] Set ENVIRONMENT=production
[ ] Set DEBUG=False
```

---

## Deployment Steps

### Option 1: Render (Easiest & Modern) ⭐ RECOMMENDED

```bash
# No CLI needed! Just use Render Dashboard

# 1. Go to https://render.com and sign up (free)

# 2. Connect your GitHub repository

# 3. Click "New +" → "Web Service"

# 4. Configure:
   - Name: greenwich-api
   - Environment: Python 3
   - Build Command: pip install -r requirements.txt
   - Start Command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# 5. Add PostgreSQL:
   - Click "New +" → "PostgreSQL"
   - Name: greenwich-db
   - Plan: Free or Starter ($7/month)
   - Copy internal database URL

# 6. Add Environment Variables (in Render dashboard):
   - DATABASE_URL: [from PostgreSQL above]
   - SECRET_KEY: [generate with: openssl rand -hex 32]
   - FIREBASE_PROJECT_ID: your-project-id
   - FIREBASE_CREDENTIALS: [paste entire JSON content]
   - GCP_PROJECT_ID: your-gcp-project
   - GCS_BUCKET_NAME: greenwich-documents-prod
   - GOOGLE_APPLICATION_CREDENTIALS: [paste entire JSON content]
   - CORS_ORIGINS: ["https://yourdomain.com"]
   - ENVIRONMENT: production
   - DEBUG: False

# 7. Deploy!
   - Click "Create Web Service"
   - Render automatically deploys from GitHub
   - Auto-deploy on every git push

# 8. Done! 🎉
   - Your API is live at: https://greenwich-api.onrender.com
   - Free SSL included
   - Auto-scaling
```

**Cost:**

- Free tier: $0/month (sleeps after 15 min inactivity)
- Starter: $7/month (always on) + $7/month (database) = **$14/month**
- Pro: $25/month + $20/month (database) = **$45/month**

**Pros:**

- ✅ Easiest deployment (no CLI needed)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL included
- ✅ Built-in monitoring
- ✅ Environment variables UI
- ✅ Zero-downtime deploys
- ✅ Auto-scaling

**Cons:**

- ⚠️ Free tier sleeps after 15 min (30-60s cold start)
- ⚠️ Limited regions
- ⚠️ Less control than VPS

---

### Option 2: Ubuntu/Linux VPS (Most Control)

```bash
# 1. Connect to server
ssh user@your-server

# 2. Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install python3.11 python3.11-venv postgresql-client nginx supervisor -y

# 3. Upload your code
# (From local machine)
rsync -avz --exclude='venv' backend/ user@your-server:/var/www/greenwich-api/

# 4. Setup application
cd /var/www/greenwich-api
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Configure .env
nano .env  # Paste your production values

# 6. Upload credentials
# Upload serviceAccountKey.json to /var/www/greenwich-api/credentials/
# Upload gcs-credentials.json to /var/www/greenwich-api/credentials/
chmod 600 /var/www/greenwich-api/credentials/*.json

# 7. Run migrations
alembic upgrade head

# 8. Create initial data (optional)
python scripts/seed_data.py

# 9. Configure Gunicorn (see DEPLOYMENT_GUIDE.md)
# Create gunicorn.conf.py

# 10. Configure Supervisor (see DEPLOYMENT_GUIDE.md)
# Create /etc/supervisor/conf.d/greenwich-api.conf

# 11. Start application
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start greenwich-api

# 12. Configure Nginx (see DEPLOYMENT_GUIDE.md)
# Create /etc/nginx/sites-available/greenwich-api
sudo ln -s /etc/nginx/sites-available/greenwich-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 13. Setup SSL (free with Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

### Option 3: Heroku (Alternative to Render)

```bash
# 1. Install Heroku CLI
# Download from https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Create app
heroku create greenwich-api

# 4. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 5. Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CREDENTIALS=$(cat serviceAccountKey.json)
# ... set all variables

# 6. Create Procfile
echo "web: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker" > Procfile
echo "release: alembic upgrade head" >> Procfile

# 7. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 8. Check logs
heroku logs --tail
```

**Note:** Heroku removed free tier in 2022. Render is now the better choice for free/low-cost hosting.

### Option 4: Docker (Most Portable)

```bash
# 1. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000"]
EOF

# 2. Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db
      - redis
    volumes:
      - ./credentials:/app/credentials:ro

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: greenwich_prod
      POSTGRES_USER: greenwich
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

# 3. Build and run
docker-compose up -d

# 4. Check logs
docker-compose logs -f api
```

---

## Post-Deployment Verification

```bash
# 1. Check health endpoint
curl https://api.yourdomain.com/health

# 2. Access API documentation
# Open browser: https://api.yourdomain.com/docs

# 3. Test authentication
curl -X POST https://api.yourdomain.com/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"test","password":"test123"}'

# 4. Check logs
# VPS: sudo tail -f /var/log/greenwich-api/error.log
# Heroku: heroku logs --tail
# Docker: docker-compose logs -f api

# 5. Monitor process
# VPS: sudo supervisorctl status greenwich-api
# Heroku: heroku ps
# Docker: docker-compose ps
```

---

## Security Checklist

```
[ ] Changed default admin password
[ ] Firewall configured (only ports 22, 80, 443 open)
[ ] SSL certificate installed
[ ] Database has strong password
[ ] Database accessible only from app server
[ ] Service account credentials have minimal permissions
[ ] SECRET_KEY is strong and unique
[ ] DEBUG=False in production
[ ] CORS configured with specific origins (not *)
[ ] Rate limiting enabled
[ ] File upload size limits configured
```

---

## Monitoring Setup

```
[ ] Setup error tracking (Sentry recommended)
[ ] Configure log rotation
[ ] Setup database backups (daily recommended)
[ ] Setup uptime monitoring (UptimeRobot, Pingdom)
[ ] Configure alerts for errors/downtime
[ ] Monitor disk space
[ ] Monitor memory usage
[ ] Monitor database connections
```

---

## Database Backup (Important!)

```bash
# Manual backup
pg_dump -h hostname -U username greenwich_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h hostname -U username greenwich_prod < backup_20241009.sql

# Automated daily backup (cron)
# Add to crontab: crontab -e
0 2 * * * pg_dump -h hostname -U username greenwich_prod > /backups/backup_$(date +\%Y\%m\%d).sql && find /backups -name "backup_*.sql" -mtime +7 -delete
```

---

## Common Issues & Solutions

### Issue: Database connection refused

```
Solution:
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall allows connection
- Verify credentials are correct
```

### Issue: Firebase authentication fails

```
Solution:
- Check FIREBASE_CREDENTIALS_PATH points to correct file
- Verify file permissions (chmod 600)
- Check Firebase project ID matches
- Ensure Email/Password auth is enabled in Firebase Console
```

### Issue: File uploads fail

```
Solution:
- Check GCS bucket exists
- Verify GOOGLE_APPLICATION_CREDENTIALS path
- Check service account has Storage Admin role
- Verify CORS is configured on bucket
```

### Issue: 502 Bad Gateway

```
Solution:
- Check if Gunicorn is running: sudo supervisorctl status
- Check logs: sudo tail -f /var/log/greenwich-api/error.log
- Restart: sudo supervisorctl restart greenwich-api
```

### Issue: High memory usage

```
Solution:
- Reduce Gunicorn workers in gunicorn.conf.py
- Check for memory leaks in logs
- Consider upgrading server
```

---

## CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest --cov=app

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/greenwich-api
            git pull origin main
            source venv/bin/activate
            pip install -r requirements.txt
            alembic upgrade head
            sudo supervisorctl restart greenwich-api
```

---

## Performance Optimization

```
[ ] Enable Redis caching
[ ] Configure database connection pooling
[ ] Use CDN for file downloads
[ ] Enable Nginx gzip compression
[ ] Configure proper HTTP caching headers
[ ] Monitor and optimize slow queries
[ ] Consider read replicas for database
```

---

## Scaling Checklist

When you need to scale:

```
[ ] Move to managed PostgreSQL (AWS RDS, Cloud SQL)
[ ] Use managed Redis (ElastiCache, Memorystore)
[ ] Add load balancer
[ ] Deploy multiple app instances
[ ] Use CDN for static assets
[ ] Enable auto-scaling
[ ] Set up database read replicas
[ ] Consider message queue (for background tasks)
```

---

## Cost Estimation

### Minimal Setup (~$20-50/month)

- VPS (DigitalOcean Droplet): $6-12/month
- PostgreSQL (managed): $15/month
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)

### Production Setup (~$100-200/month)

- VPS or Cloud Run: $30-50/month
- Managed PostgreSQL: $50-80/month
- Redis: $15-30/month
- Google Cloud Storage: $5-10/month
- Monitoring (Sentry): $26/month
- Domain + SSL: Free (Let's Encrypt)

### High-Traffic Setup ($500+/month)

- Multiple instances with load balancer
- Managed PostgreSQL with replicas
- Redis cluster
- CDN
- Advanced monitoring

---

## Support Resources

**Documentation:**

- Full Guide: `DEPLOYMENT_GUIDE.md`
- API Reference: `API_REFERENCE.md`
- Architecture: `VISUAL_OVERVIEW.md`
- Testing: `TESTING.md`

**Useful Commands:**

```bash
# Check service status
sudo supervisorctl status greenwich-api

# View logs
sudo tail -f /var/log/greenwich-api/error.log

# Restart service
sudo supervisorctl restart greenwich-api

# Check database migrations
alembic current
alembic history

# Run new migration
alembic upgrade head

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## ✅ Final Checklist

Before going live:

```
[ ] All tests passing (pytest)
[ ] Database migrated
[ ] Initial data seeded
[ ] Admin password changed
[ ] Environment variables set
[ ] Credentials uploaded securely
[ ] Application running
[ ] Health check passing
[ ] API docs accessible
[ ] SSL certificate installed
[ ] Backups configured
[ ] Monitoring setup
[ ] Logs rotating
[ ] Firewall configured
[ ] Security hardened
```

---

## 🎉 You're Ready!

Your Greenwich University Backend is production-ready!

**What you have:**

- ✅ 60+ API endpoints
- ✅ Complete authentication system
- ✅ Database with 28 tables
- ✅ File storage with presigned URLs
- ✅ 114 automated tests
- ✅ Comprehensive documentation

**Next Steps:**

1. Deploy using one of the options above
2. Build your frontend (React Native + Admin Dashboard)
3. Integrate frontend with API
4. Launch! 🚀

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
