# Deployment Guide for Academic Portal

## Backend Deployment (Render)

### Option 1: Deploy to Render (Recommended - Free)

1. **Create a Render Account:**
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Connect Your Repository:**
   - Push your code to GitHub first
   - In Render dashboard, click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory

3. **Configure the Service:**
   - **Name:** academic-portal-api
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free

4. **Environment Variables:**
   ```
   ENVIRONMENT=production
   SECRET_KEY=your-secret-key-here
   DEBUG=false
   DATABASE_URL=sqlite:///./academic_portal.db
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (usually 5-10 minutes)
   - Your API will be available at: `https://your-service-name.onrender.com`

### Option 2: Deploy to Railway

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy:**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect it's a Python app
   - Set root directory to `backend`

3. **Environment Variables:**
   - Add the same variables as Render above

## Frontend Deployment (Vercel)

### Deploy to Vercel (Recommended - Free)

1. **Create Vercel Account:**
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Deploy:**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `academic-portal-admin` folder
   - Vercel will auto-detect it's a Next.js app

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Your app will be available at: `https://your-app-name.vercel.app`

## Alternative: Deploy Both to Single Platform

### Option 1: Deploy to Railway (Both Frontend + Backend)
- Railway can host both your backend and frontend
- Create two services in the same project
- Set up environment variables to connect them

### Option 2: Deploy to DigitalOcean App Platform
- Can host full-stack applications
- More advanced but gives you more control
- Has a free tier for small apps

## Before Deployment Checklist

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Update CORS settings** (already done in main.py)

3. **Environment Variables:**
   - Never commit secret keys to GitHub
   - Use environment variables for all sensitive data

4. **Database:**
   - For production, consider PostgreSQL instead of SQLite
   - Railway and Render both offer free PostgreSQL databases

## Post-Deployment

1. **Test the API:**
   - Visit `https://your-backend-url.onrender.com/docs`
   - Test the login endpoint

2. **Test the Frontend:**
   - Visit your Vercel URL
   - Try logging in with: A001/admin123

3. **Update API URL:**
   - Make sure the frontend points to your deployed backend URL

## Cost Considerations

- **Render Free Tier:** 750 hours/month, sleeps after 15 minutes of inactivity
- **Vercel Free Tier:** Unlimited deployments, 100GB bandwidth
- **Railway Free Tier:** $5 credit monthly, pay-as-you-go after

## Domain Setup (Optional)

1. **Custom Domain:**
   - Both Render and Vercel support custom domains
   - You can buy a domain from Namecheap, GoDaddy, etc.
   - Point your domain to your deployed services

Would you like me to help you with any specific deployment platform?