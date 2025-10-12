# 🚀 Render Deployment Checklist

## ✅ Step 1: GitHub (COMPLETED)

- [x] Code pushed to GitHub
- [x] Repository: `https://github.com/DinHill/FinalYearProject`
- [x] Branch: `main`
- [x] Backend folder: `/backend`

---

## 📋 Step 2: Prepare Required Services

Before deploying on Render, make sure you have these ready:

### 2.1 Firebase Admin SDK

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Select your project
- [ ] Go to **Project Settings** → **Service Accounts**
- [ ] Click **Generate New Private Key**
- [ ] Save the JSON file (you'll need to copy its content)

**Note:** You'll paste the ENTIRE JSON content as environment variable in Render.

### 2.2 Google Cloud Storage

- [ ] Go to [GCP Console](https://console.cloud.google.com/)
- [ ] Enable Cloud Storage API
- [ ] Create a bucket: `greenwich-documents-prod`
- [ ] Create service account with Storage Admin role
- [ ] Download JSON key (you'll need to copy its content)

**Configure CORS on bucket:**

```bash
# Save this as cors.json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]

# Apply CORS
gsutil cors set cors.json gs://greenwich-documents-prod
```

### 2.3 Generate Secret Key

Run this command and save the output:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🎯 Step 3: Deploy on Render

### 3.1 Create Render Account

1. [ ] Go to [render.com](https://render.com)
2. [ ] Click **Get Started**
3. [ ] Sign up with GitHub (easiest option)
4. [ ] Authorize Render to access your repositories

### 3.2 Create PostgreSQL Database

1. [ ] In Render Dashboard, click **New +**
2. [ ] Select **PostgreSQL**
3. [ ] Configure:
   - **Name:** `greenwich-db`
   - **Database:** `greenwich`
   - **Region:** `Singapore` (closest to your users)
   - **Plan:**
     - **Free** ($0) - For testing
     - **Starter** ($7/month) - Recommended for production
4. [ ] Click **Create Database**
5. [ ] Wait for database to be ready (1-2 minutes)
6. [ ] **IMPORTANT:** Copy the **Internal Database URL**
   - Format: `postgresql://user:pass@host/database`
   - Save it - you'll need this in Step 3.3

### 3.3 Create Web Service

1. [ ] Click **New +** → **Web Service**
2. [ ] Connect your GitHub repository: `FinalYearProject`
3. [ ] Configure:

   **Basic Info:**

   - **Name:** `greenwich-api`
   - **Region:** `Singapore` (same as database)
   - **Branch:** `main`
   - **Root Directory:** `backend`

   **Build & Deploy:**

   - **Runtime:** `Python 3`
   - **Build Command:**
     ```
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```
     gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
     ```

   **Plan:**

   - **Free** ($0) - Sleeps after 15 min, good for testing
   - **Starter** ($7/month) - Always on, recommended

### 3.4 Add Environment Variables

In the web service creation page, add these environment variables:

| Variable                         | Value                        | Where to Get                        |
| -------------------------------- | ---------------------------- | ----------------------------------- |
| `DATABASE_URL`                   | `postgresql://...`           | From Step 3.2 (Internal DB URL)     |
| `SECRET_KEY`                     | `your-secret-key`            | From Step 2.3 (generated)           |
| `FIREBASE_PROJECT_ID`            | `your-project-id`            | Firebase Console                    |
| `FIREBASE_CREDENTIALS`           | `{entire JSON}`              | From Step 2.1 (entire file content) |
| `GCP_PROJECT_ID`                 | `your-gcp-project`           | GCP Console                         |
| `GCS_BUCKET_NAME`                | `greenwich-documents-prod`   | From Step 2.2                       |
| `GOOGLE_APPLICATION_CREDENTIALS` | `{entire JSON}`              | From Step 2.2 (entire file content) |
| `CORS_ORIGINS`                   | `["https://yourdomain.com"]` | Your frontend URL                   |
| `ENVIRONMENT`                    | `production`                 | Fixed value                         |
| `DEBUG`                          | `False`                      | Fixed value                         |
| `PYTHON_VERSION`                 | `3.11.5`                     | Fixed value                         |

**Tips:**

- For JSON credentials, copy the ENTIRE file content
- Mark sensitive values as **Secret** (will be hidden)
- Use exact spelling and capitalization

### 3.5 Deploy

1. [ ] Click **Create Web Service**
2. [ ] Wait for build to complete (3-5 minutes)
3. [ ] Check build logs for errors
4. [ ] Wait for **Live** status (green dot)

---

## 🔧 Step 4: Run Database Migrations

After first deployment:

1. [ ] Go to your web service in Render
2. [ ] Click **Shell** tab
3. [ ] Run migrations:
   ```bash
   alembic upgrade head
   ```
4. [ ] (Optional) Seed initial data:
   ```bash
   python scripts/seed_data.py
   ```

**Alternative:** Update build command to auto-migrate:

```bash
pip install -r requirements.txt && alembic upgrade head
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Health Endpoint

Open browser: `https://greenwich-api.onrender.com/health`

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### 5.2 Check API Documentation

Visit: `https://greenwich-api.onrender.com/docs`

You should see Swagger UI with all endpoints.

### 5.3 Test Login

```bash
curl -X POST https://greenwich-api.onrender.com/api/v1/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"student_id":"your-test-id","password":"test123"}'
```

### 5.4 Check Logs

1. [ ] Go to **Logs** tab in Render
2. [ ] Look for errors or warnings
3. [ ] Verify application started successfully

---

## 🎉 Step 6: Post-Deployment Tasks

### 6.1 Change Default Passwords

```bash
# Create a real admin account
# Use Render Shell or make API call
```

### 6.2 Set Up Custom Domain (Optional)

1. [ ] Go to **Settings** → **Custom Domains**
2. [ ] Add `api.yourdomain.com`
3. [ ] Update DNS with provided CNAME
4. [ ] Wait for SSL certificate (5-10 minutes)

### 6.3 Enable Auto-Deploy

Already enabled! Every push to `main` branch will auto-deploy.

### 6.4 Set Up Monitoring

1. [ ] Go to **Settings** → **Health & Alerts**
2. [ ] Configure health check path: `/health`
3. [ ] Add email for alerts

---

## 💰 Cost Summary

### Free Tier (Testing)

```
Web Service: $0/month
- Sleeps after 15 min
- 750 hours/month
- Good for demos

PostgreSQL: $0/month
- 1GB storage
- Good for development

Total: $0/month
```

### Starter (Recommended for Production)

```
Web Service: $7/month
- Always on
- 512MB RAM

PostgreSQL: $7/month
- 1GB storage
- Daily backups

Total: $14/month
```

---

## 🔍 Troubleshooting

### Issue: Build Failed

**Check:**

- Build command is correct
- Python version is 3.11+
- Root directory is set to `backend`

**Fix:** Check build logs in Render dashboard

### Issue: Application Won't Start

**Check:**

- All environment variables are set
- DATABASE_URL is the Internal URL (not External)
- Start command is correct

**Fix:** Check application logs

### Issue: Database Connection Error

**Check:**

- DATABASE_URL format is correct
- Database is running
- Migrations are run

**Fix:** Run migrations in Shell

### Issue: Firebase Auth Fails

**Check:**

- FIREBASE_CREDENTIALS is complete JSON
- FIREBASE_PROJECT_ID matches your project
- Firebase Email/Password auth is enabled

**Fix:** Re-paste credentials

---

## 📖 Additional Resources

- **Render Docs:** https://render.com/docs
- **FastAPI Deployment:** https://render.com/docs/deploy-fastapi
- **Your Project Docs:**
  - [Complete Render Guide](./DEPLOY_RENDER.md)
  - [Quick Deploy](./QUICK_DEPLOY.md)
  - [API Reference](./API_REFERENCE.md)

---

## ✅ Final Checklist

**Before You Start:**

- [x] Code on GitHub
- [ ] Firebase Admin SDK ready
- [ ] GCS bucket created
- [ ] Secret key generated

**Render Setup:**

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Web service created
- [ ] Environment variables configured

**After Deployment:**

- [ ] Migrations run
- [ ] Health endpoint works
- [ ] API docs accessible
- [ ] Test login works
- [ ] Logs look clean

**Production Ready:**

- [ ] Admin password changed
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled
- [ ] Auto-deploy tested

---

## 🎊 Your Backend URLs

After deployment, your API will be available at:

**Main API:** `https://greenwich-api.onrender.com`
**API Docs:** `https://greenwich-api.onrender.com/docs`
**Health Check:** `https://greenwich-api.onrender.com/health`

---

**Ready to deploy? Follow this checklist step by step! 🚀**
