# Vercel Deployment Guide - Serverless Function Size Fix

## Problem Solved
This guide addresses the "Serverless Function has exceeded the unzipped maximum size of 250 MB" error on Vercel.

## Optimizations Implemented

### 1. Dynamic Imports
- Created `src/lib/dynamicImports.ts` for lazy loading heavy dependencies
- Updated MongoDB, AWS SDK, Sharp, and other heavy packages to use dynamic imports
- Implemented caching to avoid repeated imports

### 2. Next.js Configuration
- Added `serverComponentsExternalPackages` for heavy dependencies
- Configured webpack externals for server-side rendering
- Enabled aggressive tree shaking and bundle optimization
- Disabled source maps in production
- Enabled SWC minification

### 3. Vercel Configuration
- Created `vercel.json` with optimized function settings
- Set maximum duration to 30 seconds
- Configured build environment variables

### 4. Bundle Optimization
- Split heavy dependencies into separate chunks
- Removed unnecessary fallbacks
- Optimized webpack configuration for serverless

## Files Modified

### Core Files
- `next.config.js` - Optimized webpack and build configuration
- `vercel.json` - Vercel deployment configuration
- `src/lib/dynamicImports.ts` - Dynamic import utilities

### API Routes Updated
- `src/app/api/r2/upload/route.ts` - Uses dynamic AWS SDK imports
- `src/app/api/r2/sign/route.ts` - Uses dynamic AWS SDK imports
- `src/lib/mongodb.ts` - Uses dynamic Mongoose imports
- `src/lib/imageProcessor.ts` - Uses dynamic Sharp imports

### Scripts Added
- `scripts/optimize-for-vercel.js` - Deployment optimization script
- `scripts/optimize-deps.js` - Dependency optimization script

## Deployment Steps

### 1. Environment Variables
Set these in your Vercel dashboard:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# R2 Storage
R2_ENDPOINT=your_r2_endpoint
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Optimization
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or use the optimized build
npm run build:optimized
vercel --prod
```

### 3. Monitor Function Sizes
- Check Vercel dashboard for function sizes
- Monitor deployment logs for any size warnings
- Use Vercel's function analytics to track performance

## Expected Results

### Before Optimization
- Serverless functions: ~250+ MB (exceeding limit)
- Bundle size: Large due to static imports
- Cold start time: Slow due to large bundles

### After Optimization
- Serverless functions: <50 MB (well under limit)
- Bundle size: Significantly reduced
- Cold start time: Faster due to dynamic imports
- Memory usage: Lower due to lazy loading

## Troubleshooting

### If Functions Still Exceed Size Limit

1. **Check for remaining static imports:**
   ```bash
   grep -r "import.*mongoose\|import.*sharp\|import.*@aws-sdk" src/
   ```

2. **Analyze bundle size:**
   ```bash
   npm run analyze
   ```

3. **Further optimize dependencies:**
   - Remove unused packages
   - Use lighter alternatives where possible
   - Consider splitting large API routes

### Common Issues

1. **Dynamic imports not working:**
   - Ensure all heavy dependencies use the dynamic import utilities
   - Check that imports are properly awaited

2. **Build errors:**
   - Verify all dynamic imports are properly typed
   - Check that fallback handling is implemented

3. **Runtime errors:**
   - Ensure environment variables are set
   - Check that dynamic imports are cached properly

## Performance Monitoring

### Key Metrics to Watch
- Function size (should be <50 MB)
- Cold start time (should be <2 seconds)
- Memory usage (should be <512 MB)
- Execution time (should be <30 seconds)

### Optimization Tips
- Use Vercel's edge functions for simple operations
- Implement proper caching strategies
- Monitor and optimize database queries
- Use CDN for static assets

## Additional Resources

- [Vercel Serverless Functions Documentation](https://vercel.com/docs/functions/serverless-functions)
- [Next.js Bundle Analysis](https://nextjs.org/docs/advanced-features/analyzing-bundles)
- [Webpack Bundle Optimization](https://webpack.js.org/guides/code-splitting/)

## Support

If you encounter issues:
1. Check the deployment logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure all dynamic imports are properly implemented
4. Monitor function metrics for performance issues
