# 🚀 Deploy to Render - Complete Guide

## Why Render?

Render is the **modern alternative to Heroku** - easier than VPS, cheaper than Heroku, and perfect for your final year project!

### Key Benefits

- ✅ **Free tier available** (with limitations)
- ✅ **No CLI needed** - everything in web dashboard
- ✅ **Auto-deploy from GitHub** - push to deploy
- ✅ **Free SSL/HTTPS** - automatic certificates
- ✅ **Built-in monitoring** - logs and metrics
- ✅ **Environment variables UI** - easy configuration
- ✅ **Zero-downtime deploys** - no interruption
- ✅ **PostgreSQL included** - managed database

---

## 📋 Prerequisites

Before starting, you need:

- [ ] GitHub account (your code must be on GitHub)
- [ ] Render account (free - sign up at render.com)
- [ ] Firebase project with Admin SDK key
- [ ] Google Cloud Storage bucket
- [ ] GCS service account credentials

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

#### 1.1 Ensure your code is on GitHub

```bash
cd "d:\Dinh Hieu\Final Year Project\backend"

# Initialize git (if not already)
git init
git add .
git commit -m "Prepare for Render deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/greenwich-backend.git
git branch -M main
git push -u origin main
```

#### 1.2 Create Required Files

**Create `render.yaml`** (optional, but recommended):

```yaml
services:
  - type: web
    name: greenwich-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.5
      - key: DATABASE_URL
        fromDatabase:
          name: greenwich-db
          property: connectionString

databases:
  - name: greenwich-db
    databaseName: greenwich
    user: greenwich
    plan: free # or 'starter' for $7/month
```

**Update `requirements.txt`** - ensure gunicorn is included:

```txt
# Add this line if not present
gunicorn==21.2.0
```

**Create `.env.render`** (for reference, not committed):

```env
# These will be set in Render dashboard
DATABASE_URL=will_be_auto_set_by_render
SECRET_KEY=generate_in_next_step
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CREDENTIALS=paste_json_content
GCP_PROJECT_ID=your-gcp-project
GCS_BUCKET_NAME=greenwich-documents-prod
GOOGLE_APPLICATION_CREDENTIALS=paste_json_content
CORS_ORIGINS=["https://yourdomain.com"]
ENVIRONMENT=production
DEBUG=False
```

Commit and push:

```bash
git add .
git commit -m "Add Render configuration"
git push origin main
```

---

### Step 2: Create Render Account

1. **Go to [render.com](https://render.com)**
2. **Click "Get Started"**
3. **Sign up with GitHub** (recommended for easy integration)
4. **Authorize Render** to access your repositories

---

### Step 3: Create PostgreSQL Database

1. **In Render Dashboard:**

   - Click "New +" button (top right)
   - Select "PostgreSQL"

2. **Configure Database:**

   - **Name:** `greenwich-db`
   - **Database:** `greenwich` (leave default)
   - **User:** `greenwich` (leave default)
   - **Region:** Choose closest to your users (e.g., Singapore)
   - **PostgreSQL Version:** 15 (latest)
   - **Plan:**
     - **Free** ($0/month) - Good for testing, limited storage
     - **Starter** ($7/month) - Recommended for production

3. **Click "Create Database"**

4. **Wait for database to be ready** (1-2 minutes)

5. **Copy Connection Details:**
   - Go to database page
   - Copy **Internal Database URL** (starts with `postgresql://`)
   - Save for later - you'll use this in Step 5

---

### Step 4: Create Web Service

1. **In Render Dashboard:**

   - Click "New +" button
   - Select "Web Service"

2. **Connect Repository:**

   - Find your GitHub repository
   - Click "Connect"

3. **Configure Web Service:**

   **Basic Settings:**

   - **Name:** `greenwich-api`
   - **Region:** Same as your database (e.g., Singapore)
   - **Branch:** `main`
   - **Root Directory:** Leave blank (or `backend` if in subfolder)

   **Build & Deploy:**

   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
     ```

   **Plan:**

   - **Free** ($0/month) - App sleeps after 15min inactivity, 750hrs/month
   - **Starter** ($7/month) - Always on, recommended for production
   - **Standard** ($25/month) - More resources, auto-scaling

4. **DO NOT click "Create Web Service" yet!** - We need to add environment variables first

---

### Step 5: Configure Environment Variables

In the web service creation page, scroll to **Environment Variables** section:

#### 5.1 Generate Secret Key

Open terminal and run:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output.

#### 5.2 Prepare Firebase Credentials

Open `serviceAccountKey.json` and copy the **entire content** (it's one long line of JSON).

#### 5.3 Prepare GCS Credentials

Open your GCS service account JSON file and copy the **entire content**.

#### 5.4 Add Environment Variables in Render

Click "Add Environment Variable" for each:

| Key                              | Value                                     | Type       |
| -------------------------------- | ----------------------------------------- | ---------- |
| `DATABASE_URL`                   | [Paste Internal Database URL from Step 3] | Secret     |
| `SECRET_KEY`                     | [Generated secret from step 5.1]          | Secret     |
| `FIREBASE_PROJECT_ID`            | `your-firebase-project-id`                | Plain text |
| `FIREBASE_CREDENTIALS`           | [Entire JSON content from step 5.2]       | Secret     |
| `GCP_PROJECT_ID`                 | `your-gcp-project-id`                     | Plain text |
| `GCS_BUCKET_NAME`                | `greenwich-documents-prod`                | Plain text |
| `GOOGLE_APPLICATION_CREDENTIALS` | [Entire JSON content from step 5.3]       | Secret     |
| `CORS_ORIGINS`                   | `["https://yourdomain.com"]`              | Plain text |
| `ENVIRONMENT`                    | `production`                              | Plain text |
| `DEBUG`                          | `False`                                   | Plain text |
| `PYTHON_VERSION`                 | `3.11.5`                                  | Plain text |

**Important Notes:**

- Mark sensitive values (SECRET_KEY, credentials) as **Secret** - they'll be hidden
- For JSON credentials, paste the **entire JSON as a single line**
- CORS_ORIGINS should be a JSON array string
- Use exact spelling and capitalization

---

### Step 6: Deploy!

1. **Click "Create Web Service"**

2. **Watch the build logs:**

   - Render will clone your repo
   - Install dependencies
   - Start your application

3. **Wait for deployment** (3-5 minutes for first deploy)

4. **Check for success:**
   - Look for "Live" status with green dot
   - URL will be: `https://greenwich-api.onrender.com`

---

### Step 7: Run Database Migrations

After first deployment, you need to run migrations:

#### Option A: Using Render Shell (Recommended)

1. **Go to your web service page**
2. **Click "Shell" tab** (or "Shell" button in top right)
3. **Run migrations:**
   ```bash
   alembic upgrade head
   ```
4. **(Optional) Seed initial data:**
   ```bash
   python scripts/seed_data.py
   ```

#### Option B: Add to Build Command

Update your build command in Render settings:

```bash
pip install -r requirements.txt && alembic upgrade head
```

This runs migrations automatically on every deploy.

---

### Step 8: Verify Deployment

#### 8.1 Check Health Endpoint

Open browser or use curl:

```bash
curl https://greenwich-api.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### 8.2 Check API Documentation

Visit: `https://greenwich-api.onrender.com/docs`

You should see the Swagger UI with all your endpoints.

#### 8.3 Test Authentication

```bash
curl -X POST https://greenwich-api.onrender.com/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"test","password":"test123"}'
```

#### 8.4 Check Logs

In Render dashboard:

1. Go to your web service
2. Click "Logs" tab
3. Watch for errors or issues

---

## 🎯 Post-Deployment Configuration

### Custom Domain (Optional)

1. **In Render Dashboard:**

   - Go to your web service
   - Click "Settings"
   - Scroll to "Custom Domains"
   - Click "Add Custom Domain"

2. **Add your domain:**

   - Enter: `api.yourdomain.com`
   - Render provides DNS instructions

3. **Update DNS:**

   - Go to your domain registrar
   - Add CNAME record: `api` → `greenwich-api.onrender.com`

4. **SSL Certificate:**
   - Render automatically provisions SSL
   - Takes 5-10 minutes

### Auto-Deploy from GitHub

Already enabled by default! Every push to `main` branch triggers a deploy.

To disable:

1. Go to Settings → Build & Deploy
2. Toggle "Auto-Deploy" off

### Environment Variable Updates

To update environment variables:

1. Go to Environment tab
2. Edit or add variables
3. Click "Save Changes"
4. Service automatically redeploys

---

## 📊 Monitoring & Maintenance

### View Logs

```
Dashboard → Your Service → Logs
```

Logs show:

- Application output
- Errors and warnings
- Request logs
- Deployment logs

### Metrics

```
Dashboard → Your Service → Metrics
```

View:

- CPU usage
- Memory usage
- Request count
- Response times

### Health Checks

Render automatically monitors `/health` endpoint.

To configure:

1. Go to Settings → Health & Alerts
2. Configure health check path
3. Set alert notifications

---

## 💰 Cost Breakdown

### Free Tier

```
Web Service: $0/month
- 750 hours/month
- Sleeps after 15 min inactivity
- 30-60s cold start
- Good for: Testing, demos

PostgreSQL: $0/month
- 1GB storage
- Limited connections
- Good for: Development
```

### Starter (Recommended)

```
Web Service: $7/month
- Always on
- No cold starts
- 0.5 CPU, 512MB RAM
- Good for: Production

PostgreSQL: $7/month
- 1GB storage
- More connections
- Daily backups
- Good for: Production

Total: $14/month
```

### Standard (Scaling)

```
Web Service: $25/month
- 1 CPU, 2GB RAM
- Auto-scaling
- Good for: High traffic

PostgreSQL: $20/month
- 10GB storage
- High availability
- Point-in-time recovery

Total: $45/month
```

---

## 🔧 Troubleshooting

### Issue: Build Failed

**Check:**

- `requirements.txt` is correct
- Python version matches (3.11+)
- All dependencies are available

**Solution:**

```bash
# Test locally first
pip install -r requirements.txt
```

### Issue: Application Won't Start

**Check logs for:**

- Import errors
- Database connection issues
- Missing environment variables

**Solution:**

1. Check all environment variables are set
2. Verify DATABASE_URL format
3. Check credentials JSON is valid

### Issue: Database Connection Error

**Check:**

- DATABASE_URL is correct (use Internal URL, not External)
- Database is running (check status)
- Migrations are run

**Solution:**

```bash
# In Render Shell
alembic upgrade head
```

### Issue: Firebase Authentication Fails

**Check:**

- FIREBASE_CREDENTIALS contains complete JSON
- FIREBASE_PROJECT_ID matches your project
- Email/Password auth is enabled in Firebase

**Solution:**

- Re-paste Firebase credentials (entire JSON)
- Verify project ID

### Issue: File Upload Fails

**Check:**

- GCS credentials are correct
- Bucket exists and is accessible
- CORS is configured on bucket

**Solution:**

```bash
# Configure CORS on GCS bucket
gsutil cors set cors.json gs://greenwich-documents-prod
```

### Issue: 502 Bad Gateway

**Check:**

- Application is actually running (check logs)
- Start command is correct
- Port binding uses $PORT variable

**Solution:**

- Ensure start command uses `--bind 0.0.0.0:$PORT`
- Check application logs for startup errors

---

## 🚀 Advanced Configuration

### Background Workers

For Dramatiq background tasks:

1. **Create Worker Service:**

   - New + → Background Worker
   - Build command: `pip install -r requirements.txt`
   - Start command: `dramatiq app.tasks`

2. **Add Redis:**
   - New + → Redis
   - Free or paid plan
   - Add REDIS_URL to both services

### Scheduled Jobs (Cron)

1. **Create Cron Job:**
   - New + → Cron Job
   - Schedule: `0 2 * * *` (daily at 2 AM)
   - Command: `python scripts/cleanup.py`

### Multiple Environments

Create separate services for staging and production:

```
greenwich-api-staging (main branch)
greenwich-api-prod (release branch)
```

### Secrets Management

Use Render's secret files for large files:

1. Settings → Secret Files
2. Add File:
   - Filename: `/app/credentials/serviceAccountKey.json`
   - Contents: [Paste JSON]

Update code to read from file path instead of env var.

---

## 🔄 Continuous Deployment

### Automatic Deploys

Already configured! On every push to main:

1. Render detects changes
2. Runs build command
3. Deploys new version
4. Zero-downtime deployment

### Manual Deploy

To manually trigger deploy:

1. Go to your service
2. Click "Manual Deploy" button
3. Select branch
4. Click "Deploy"

### Rollback

To rollback to previous version:

1. Go to Events tab
2. Find previous successful deploy
3. Click "Rollback"

---

## 📈 Scaling

### Vertical Scaling (Bigger Instance)

1. Go to Settings → Instance Type
2. Choose larger plan:
   - Starter: $7 (0.5 CPU, 512MB)
   - Standard: $25 (1 CPU, 2GB)
   - Pro: $85 (2 CPU, 4GB)

### Horizontal Scaling (Multiple Instances)

Available on Standard+ plans:

1. Settings → Scaling
2. Set min/max instances
3. Configure auto-scaling rules

### Database Scaling

1. Go to your database
2. Settings → Instance Type
3. Choose larger plan

---

## ✅ Deployment Checklist

**Before Deploy:**

- [ ] Code is on GitHub
- [ ] requirements.txt includes gunicorn
- [ ] Environment variables documented
- [ ] Firebase credentials ready
- [ ] GCS bucket created

**During Setup:**

- [ ] PostgreSQL database created
- [ ] Web service created
- [ ] All environment variables set
- [ ] Build command configured
- [ ] Start command configured

**After Deploy:**

- [ ] Service is Live (green status)
- [ ] Migrations run (alembic upgrade head)
- [ ] Health endpoint working
- [ ] API docs accessible (/docs)
- [ ] Test login working
- [ ] Logs look clean
- [ ] Change default admin password

**Production Ready:**

- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Backup strategy configured
- [ ] Auto-deploy working
- [ ] Environment variables secured

---

## 🎉 Success!

Your Greenwich University Backend is now live on Render!

**Your API URL:** `https://greenwich-api.onrender.com`

**What's Next:**

1. Test all endpoints
2. Build your frontend (React Native + Admin Dashboard)
3. Integrate frontend with API
4. Monitor logs and performance
5. Scale as needed

---

## 📞 Support Resources

**Render Documentation:**

- https://render.com/docs
- https://render.com/docs/deploy-fastapi

**Your Project Documentation:**

- [API Reference](./API_REFERENCE.md)
- [Testing Guide](./TESTING.md)
- [Architecture](./VISUAL_OVERVIEW.md)

**Render Support:**

- Community: https://community.render.com
- Status: https://status.render.com
- Contact: support@render.com

---

**🎊 Congratulations! Your backend is deployed! 🎊**
