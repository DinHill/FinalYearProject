# Cloudinary Setup Guide

## Quick Setup (5 minutes)

### Why Cloudinary?
- ✅ **FREE:** 25GB storage + 25GB bandwidth/month
- ✅ **No credit card required**
- ✅ Easy integration
- ✅ Image optimization built-in
- ✅ Perfect for profile pictures, documents, PDFs

---

## Step 1: Create Cloudinary Account

1. Go to: https://cloudinary.com/users/register/free
2. Sign up with email or Google/GitHub
3. Choose a **Cloud Name** (e.g., `greenwich-portal`)
   - ⚠️ Must be unique across all Cloudinary users
   - Use lowercase, no spaces
   - **SAVE THIS** - you'll need it!

---

## Step 2: Get Your API Credentials

After signing up, you'll be taken to the **Dashboard**.

You'll see these credentials:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

**Copy all three values!** You'll need them for Render.

### Where to Find Them Later:
1. Go to: https://console.cloudinary.com/console
2. Click on **"Settings"** (gear icon) in the top right
3. Go to **"Access Keys"** tab
4. You'll see your credentials there

---

## Step 3: Add Environment Variables to Render

1. Go to: https://dashboard.render.com
2. Select your **greenwich-api** service
3. Click **Environment** tab
4. Click **Add Environment Variable** (3 times for 3 variables)

Add these variables:

| Key | Value | Where to Get It |
|-----|-------|-----------------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Your API key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Your API secret | Cloudinary Dashboard |

5. Click **Save Changes**
6. Render will auto-redeploy (1-2 minutes)

---

## Step 4: Test File Upload

After deployment completes:

1. Go to your API docs: `https://greenwich-api.onrender.com/docs`
2. Find the **POST /api/v1/documents/upload-url** endpoint
3. Try uploading a test file
4. Check your Cloudinary Dashboard → **Media Library**
5. You should see your uploaded file!

---

## Cloudinary Features You Get:

### Image Optimization
- Automatic format conversion (WebP for browsers that support it)
- Automatic quality optimization
- Responsive image URLs

### File Management
- Organize files in folders
- Tag files for easy searching
- Set expiration dates for temporary files

### Security
- Signed URLs (optional)
- Access control
- Automatic virus scanning (on paid plans)

### Supported File Types
- ✅ Images: JPG, PNG, GIF, WebP, SVG
- ✅ Documents: PDF
- ✅ Videos: MP4, WebM (within limits)
- ✅ Raw files: Any file type

---

## Free Tier Limits

- **Storage:** 25 GB
- **Bandwidth:** 25 GB/month
- **Transformations:** 25 credits/month
- **Images/Videos:** Unlimited

**This is more than enough for your academic portal!**

If you exceed limits:
- Cloudinary won't charge you automatically
- You'll get notified to upgrade
- Your existing files remain accessible

---

## Troubleshooting

### "Invalid API credentials"
- Double-check you copied the correct values
- Make sure no extra spaces in environment variables
- Verify Cloud Name is correct (case-sensitive)

### "Upload failed"
- Check file size (max 10MB on free tier per file)
- Verify file type is supported
- Check Cloudinary Dashboard for error logs

### Files not appearing in Media Library
- Wait a few seconds for processing
- Check the correct folder (default is root)
- Verify the upload actually succeeded (check API response)

---

## Upgrade Path (If Needed Later)

**Free Plan:** $0/month
- 25 GB storage
- 25 GB bandwidth
- Perfect for development

**Plus Plan:** $89/month (only if you need more)
- 190 GB storage
- 190 GB bandwidth
- Advanced features

**For your academic portal, FREE plan should be sufficient!**

---

## Quick Reference

**Dashboard:** https://console.cloudinary.com/console  
**Documentation:** https://cloudinary.com/documentation  
**Render Dashboard:** https://dashboard.render.com  

---

## Security Best Practices

🔒 **Keep your API Secret secure:**
- Never commit it to GitHub
- Only store it in Render environment variables
- Don't share it publicly

🔒 **Use signed URLs for sensitive files** (optional):
- Cloudinary can generate time-limited URLs
- Prevents unauthorized access
- Good for private student documents

✅ **The backend is already configured to use Cloudinary securely!**
