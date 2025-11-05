# Render Force Deploy Guide - Kobac Real Estate

## Quick Force Deploy Methods

### Method 1: Use the Force Deploy Script (Recommended)
```bash
node force-deploy.js
```

### Method 2: Manual Force Deploy
```bash
# Clean everything
rm -rf node_modules package-lock.json .next

# Fresh install
npm install

# Build
npm run build

# Force push
git add .
git commit -m "Force deploy $(date)"
git push origin main --force
```

### Method 3: Render Dashboard Force Deploy
1. Go to your Render dashboard
2. Click on your service
3. Go to "Settings" tab
4. Click "Manual Deploy" → "Deploy latest commit"

## Common Render Deployment Errors & Solutions

### Error: "Build failed - npm ci failed"
**Solution:**
```bash
# Update render.yaml to use npm install instead
buildCommand: npm install && npm run build
```

### Error: "Docker build failed"
**Solution:**
1. Switch to Node.js environment in Render dashboard
2. Or use the `render-node.yaml` configuration
3. Or fix Dockerfile issues (see below)

### Error: "Out of memory during build"
**Solution:**
1. Upgrade to a paid plan
2. Or optimize your build process
3. Add this to package.json:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

### Error: "Module not found"
**Solution:**
1. Check all dependencies are in package.json
2. Run `npm install` locally first
3. Check for case-sensitive file names

### Error: "Port binding failed"
**Solution:**
1. Ensure your app uses `process.env.PORT || 3000`
2. Add PORT environment variable in Render
3. Update start command to use PORT

## Dockerfile Troubleshooting

### If Docker build fails, try this simplified Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
```

## Environment Variables Checklist

Make sure these are set in Render dashboard:
- ✅ `NODE_ENV=production`
- ✅ `MONGODB_URI=your_mongodb_uri`
- ✅ `R2_ENDPOINT=your_r2_endpoint`
- ✅ `R2_ACCESS_KEY_ID=your_access_key`
- ✅ `R2_SECRET_ACCESS_KEY=your_secret_key`
- ✅ `R2_BUCKET=your_bucket_name`
- ✅ `NEXTAUTH_SECRET=your_secret`
- ✅ `NEXTAUTH_URL=https://your-app.onrender.com`
- ✅ `PORT=3000`

## Alternative Deployment Methods

### Method 1: Vercel (Easier)
```bash
npm i -g vercel
vercel --prod
```

### Method 2: Railway
1. Connect GitHub repo to Railway
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy

### Method 3: Netlify
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables

## Force Deploy Commands

### Git Force Push
```bash
git push origin main --force
```

### Render CLI (if available)
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

### Manual Trigger
1. Make a small change to any file
2. Commit and push
3. This triggers a new deployment

## Debugging Steps

### 1. Check Build Logs
- Go to Render dashboard
- Click on your service
- Check "Logs" tab for errors

### 2. Test Locally
```bash
npm run build
npm start
# Test at http://localhost:3000
```

### 3. Check Dependencies
```bash
npm audit
npm audit fix
```

### 4. Verify Environment
```bash
# Check if all env vars are set
node -e "console.log(process.env)"
```

## Emergency Rollback

If deployment breaks your app:
1. Go to Render dashboard
2. Click "Manual Deploy"
3. Select a previous working commit
4. Deploy that version

## Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ App starts and responds to health checks
- ✅ You can access the URL
- ✅ All features work (login, uploads, etc.)

## Still Having Issues?

1. **Check Render Status**: https://status.render.com
2. **Contact Render Support**: Through their dashboard
3. **Try Alternative Platform**: Vercel, Railway, or Netlify
4. **Check GitHub Issues**: Look for similar problems

## Quick Fixes Summary

| Error | Quick Fix |
|-------|-----------|
| Build fails | Use `npm install` instead of `npm ci` |
| Docker fails | Switch to Node.js environment |
| Out of memory | Upgrade plan or optimize build |
| Port issues | Add PORT environment variable |
| Module not found | Check package.json dependencies |
| Timeout | Increase build timeout in settings |

Remember: The force deploy script (`node force-deploy.js`) handles most common issues automatically!
