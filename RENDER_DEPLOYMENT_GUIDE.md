# Render Deployment Guide - Kobac Real Estate

## Files Created for Deployment

✅ **Dockerfile** - Container configuration for Render
✅ **.dockerignore** - Excludes unnecessary files from Docker build
✅ **render.yaml** - Render service configuration
✅ **next.config.js** - Updated for standalone output

## Quick Deployment Steps

### 1. Commit and Push Files
```bash
git add Dockerfile .dockerignore render.yaml next.config.js
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Configure Render Service

**In Render Dashboard:**

**Basic Settings:**
- **Name**: `Kobac-Real-Estate`
- **Language**: `Docker` (should auto-detect Dockerfile)
- **Branch**: `main`
- **Region**: `Oregon (US West)`
- **Root Directory**: Leave empty

**Build & Start Commands:**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

**Instance Type:**
- **Free** (start with this)

### 3. Environment Variables

Add these environment variables in Render:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://kobac-real-estate.onrender.com
```

### 4. Deploy
1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Your app will be live at `https://kobac-real-estate.onrender.com`

## What This Configuration Does

### Dockerfile Benefits:
- **Multi-stage build** - Reduces final image size
- **Security** - Runs as non-root user
- **Optimization** - Only includes production dependencies
- **Standalone output** - Self-contained Next.js app

### Render Configuration:
- **Auto-deploy** - Deploys on git push
- **Environment variables** - Secure configuration
- **Free tier** - No cost to start
- **Easy scaling** - Upgrade when needed

## Troubleshooting

### If Build Fails:
1. Check build logs in Render dashboard
2. Verify all dependencies are in package.json
3. Ensure Dockerfile syntax is correct

### If App Crashes:
1. Check runtime logs
2. Verify environment variables are set
3. Test database connection

### If Still Getting Dockerfile Error:
1. Make sure Dockerfile is committed to GitHub
2. Refresh Render page
3. Or switch to Node.js language instead of Docker

## Success Checklist

- [ ] Files committed and pushed to GitHub
- [ ] Render service created with Docker language
- [ ] Environment variables added
- [ ] Build completes successfully
- [ ] App starts without errors
- [ ] All functionality works
- [ ] Performance is acceptable

## Next Steps After Deployment

1. **Test all features** - Registration, login, property listings, file uploads
2. **Monitor performance** - Check Render dashboard for metrics
3. **Set up custom domain** (optional)
4. **Upgrade plan** if needed for production use

Your app should now deploy successfully on Render! 🚀
