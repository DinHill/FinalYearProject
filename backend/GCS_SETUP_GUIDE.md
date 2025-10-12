# Google Cloud Storage Setup Guide

## Quick Setup (5 minutes)

### Prerequisites

✅ Firebase project created  
✅ Google account with Firebase access

---

## Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com
2. Sign in with your Firebase Google account
3. You'll see the Google Cloud Console dashboard

---

## Step 2: Select Your Firebase Project

1. Click the **project dropdown** at the top of the page (next to "Google Cloud")
2. Find your Firebase project in the list
   - It should have the same name as your Firebase project
   - The Project ID matches your `FIREBASE_PROJECT_ID`
3. Click on it to select it

**📝 Note:** Firebase automatically creates a Google Cloud project with the same ID, so you don't need to create a new project!

---

## Step 3: Enable Cloud Storage API

### Option A: If prompted to enable API

- You may see a banner saying "Enable Cloud Storage API"
- Click **Enable**
- Wait 10-30 seconds for activation

### Option B: Manual activation

1. In the left sidebar, click **☰** (hamburger menu)
2. Go to **APIs & Services** → **Library**
3. Search for "Cloud Storage"
4. Click **Cloud Storage API**
5. Click **Enable** button
6. Wait for activation

---

## Step 4: Create a Storage Bucket

1. In the left sidebar (☰ menu), scroll down to **Cloud Storage** → **Buckets**
2. Click **CREATE BUCKET** button

### Bucket Configuration:

**Name your bucket:**

- Enter a unique name (lowercase, no spaces)
- Suggestion: `greenwich-academic-portal` or `your-project-name-files`
- Must be globally unique across ALL of Google Cloud
- ⚠️ **SAVE THIS NAME** - you'll need it for `GCS_BUCKET_NAME`

**Choose where to store your data:**

- Select **Region**
- Choose a region close to your users or Render deployment
- Recommended: `us-east1` (same as Render if you're using US East)
- Or choose your local region for better performance

**Choose a default storage class:**

- Select **Standard** (for frequently accessed data)

**Choose how to control access:**

- ✅ Uncheck "Enforce public access prevention on this bucket"
- Select **Fine-grained** (object-level permissions)

**Choose how to protect object data:**

- Leave defaults (no versioning needed for now)

**Click CREATE** at the bottom

---

## Step 5: Get Your Environment Variables

### Variable 1: `GCP_PROJECT_ID`

📍 **Where to find it:**

- Top of the Google Cloud Console page
- Or go to: **☰ Menu** → **IAM & Admin** → **Settings**
- Look for **Project ID** (NOT Project Name)
- Example: `greenwich-portal-12345`

### Variable 2: `GCS_BUCKET_NAME`

📍 **Where to find it:**

- The name you just entered when creating the bucket
- Or go to: **Cloud Storage** → **Buckets**
- Copy the bucket name from the list

### Variable 3: `FIREBASE_CLIENT_CERT_URL`

📍 **Where to find it:**

- Go back to Firebase Console: https://console.firebase.google.com
- Select your project
- Click **⚙️ (Settings icon)** → **Project settings**
- Go to **Service accounts** tab
- Click **Generate new private key** button
- Download the JSON file
- Open the JSON file and find the `client_x509_cert_url` field
- Copy the entire URL

**Example JSON:**

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."  ← THIS ONE
}
```

---

## Step 6: Add Environment Variables to Render

1. Go to: https://dashboard.render.com
2. Select your **greenwich-api** service
3. Click **Environment** tab in the left sidebar
4. Click **Add Environment Variable** button (3 times for 3 variables)

Add these variables:

| Key                        | Value                              | Example                                                 |
| -------------------------- | ---------------------------------- | ------------------------------------------------------- |
| `GCP_PROJECT_ID`           | Your project ID from Step 5        | `greenwich-portal-12345`                                |
| `GCS_BUCKET_NAME`          | Your bucket name from Step 5       | `greenwich-academic-portal`                             |
| `FIREBASE_CLIENT_CERT_URL` | Full URL from service account JSON | `https://www.googleapis.com/robot/v1/metadata/x509/...` |

5. Click **Save Changes** button at the bottom
6. Render will automatically redeploy your service (takes 1-2 minutes)

---

## Step 7: Verify Deployment

### Check Render Logs:

1. Go to your service → **Logs** tab
2. Wait for the build to complete
3. Look for: ✅ **"Application startup complete"**
4. Should NOT see validation errors anymore

### Test Your API:

1. Open: `https://greenwich-api.onrender.com/health`
2. Should see: `{"status": "healthy", "version": "1.0.0"}`

### Check API Documentation:

1. Open: `https://greenwich-api.onrender.com/docs`
2. You should see the Swagger UI with all endpoints

---

## Step 8: Run Database Migrations

⚠️ **IMPORTANT:** After successful deployment, you need to run migrations!

### Method 1: Via Render Shell (Recommended)

1. In Render dashboard → Your service
2. Click **Shell** tab
3. Wait for shell to connect
4. Run: `alembic upgrade head`
5. You should see migrations being applied

### Method 2: Auto-migrate on Build

1. Go to your service → **Settings**
2. Find **Build Command**
3. Change from:
   ```bash
   pip install -r requirements.txt
   ```
   To:
   ```bash
   pip install -r requirements.txt && alembic upgrade head
   ```
4. Save changes → Redeploys automatically

---

## Troubleshooting

### "Bucket name already exists"

- Bucket names are globally unique
- Try adding numbers: `greenwich-portal-2024-v1`

### "Permission denied" errors

- Make sure you're using the same Google account for both Firebase and Cloud
- Check that you're in the correct project

### "Cloud Storage API not enabled"

- Go to APIs & Services → Library
- Search "Cloud Storage API"
- Click Enable

### Application still won't start

- Double-check all 3 environment variables are added in Render
- Check Render logs for specific error messages
- Verify the `client_x509_cert_url` is the full URL (starts with `https://`)

---

## What's Next?

After successful deployment:

1. ✅ Change default admin password
2. ✅ Test file upload endpoints
3. ✅ Add `OPENAI_API_KEY` if you want AI chat (optional)
4. ✅ Add `SENDGRID_API_KEY` if you want email notifications (optional)
5. ✅ Set up custom domain (optional)

---

## Quick Reference

**Google Cloud Console:** https://console.cloud.google.com  
**Firebase Console:** https://console.firebase.google.com  
**Render Dashboard:** https://dashboard.render.com

**Need Help?**

- Check Render logs for errors
- Verify all environment variables are set
- Make sure Cloud Storage API is enabled
- Confirm bucket was created successfully

---

## Security Notes

🔒 **Keep your service account JSON file secure:**

- Don't commit it to GitHub
- Don't share it publicly
- Store it safely (you may need it later)

🔒 **The environment variables in Render are encrypted and secure**

✅ Your GCS bucket is private by default (only accessible via your backend API)
