# 🚀 Image Upload Fixes - Deployment Guide

## Overview
This guide helps you deploy the fixes for the "same image showing" issue in your property upload system.

## 🔧 Fixes Implemented

### 1. **Unique Key Generator** (`src/lib/uniqueKeyGenerator.ts`)
- Prevents R2 key collisions
- Generates unique keys with timestamp + UUID
- Sanitizes filenames safely

### 2. **Fixed Upload Route** (`src/app/api/properties/upload-images-fixed/route.ts`)
- Processes files in parallel to prevent shared state
- Uses unique key generation
- Adds cache headers for immutable content
- Validates URL uniqueness

### 3. **Cache Busting Utilities** (`src/lib/cacheBuster.ts`)
- Adds version parameters to URLs
- Prevents stale image caching
- Property-specific cache busting

### 4. **Updated PropertyImage Component** (`src/components/ui/PropertyImage.tsx`)
- Integrated cache busting
- Better error handling
- Property metadata support

## 📋 Deployment Steps

### Step 1: Test the Fixes
```bash
# Run the diagnostic script
node scripts/diagnose-image-issue.js

# Run the test suite
node scripts/test-image-fixes.js
```

### Step 2: Deploy the Fixed Upload Route
```bash
# Option A: Replace existing route (backup first!)
cp src/app/api/properties/upload-images/route.ts src/app/api/properties/upload-images/route.ts.backup
cp src/app/api/properties/upload-images-fixed/route.ts src/app/api/properties/upload-images/route.ts

# Option B: Test with new endpoint first
# Update your frontend to use /api/properties/upload-images-fixed temporarily
```

### Step 3: Update Frontend Components
```bash
# The PropertyImage component is already updated
# Make sure to pass property metadata for cache busting:

<PropertyImage 
  property={{
    ...property,
    updatedAt: property.updatedAt,
    _id: property._id,
    propertyId: property.propertyId
  }}
  enableCacheBusting={true}
/>
```

### Step 4: Environment Variables Check
Ensure these are set in your environment:
```bash
R2_ENDPOINT=your-r2-endpoint
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_BASE_URL=your-custom-domain (optional)
```

### Step 5: Test Upload Flow
1. Upload multiple images to a property
2. Check Network tab for unique URLs
3. Verify images display correctly
4. Check R2 bucket for unique keys

## 🔍 Verification Checklist

- [ ] **Unique Keys**: Each uploaded file has a unique R2 key
- [ ] **Unique URLs**: API returns different URLs for each file
- [ ] **Cache Busting**: URLs include version parameters
- [ ] **Image Display**: Different images show correctly
- [ ] **No Duplicates**: Same image doesn't appear multiple times

## 🚨 Rollback Plan

If issues occur:
```bash
# Restore original upload route
cp src/app/api/properties/upload-images/route.ts.backup src/app/api/properties/upload-images/route.ts

# Disable cache busting temporarily
# Set enableCacheBusting={false} in PropertyImage components
```

## 📊 Monitoring

After deployment, monitor:
- Upload success rates
- Image loading times
- Error logs for key collisions
- R2 storage usage

## 🐛 Troubleshooting

### Issue: Still seeing same images
**Check:**
1. Browser cache (hard refresh)
2. CDN cache settings
3. R2 bucket permissions
4. URL generation in API response

### Issue: Upload failures
**Check:**
1. Environment variables
2. R2 credentials
3. File size limits
4. Network connectivity

### Issue: Cache busting not working
**Check:**
1. Property metadata is passed correctly
2. Cache buster utility is imported
3. URLs are being modified correctly

## 📈 Performance Impact

- **Positive**: Better cache control, reduced duplicate uploads
- **Minimal**: Slight increase in URL length due to cache busters
- **Recommended**: Monitor R2 costs for duplicate storage

## 🔄 Next Steps

1. **Monitor** the fixes for 24-48 hours
2. **Collect feedback** from users
3. **Optimize** cache settings based on usage patterns
4. **Consider** implementing image deduplication if needed

---

## 📞 Support

If you encounter issues:
1. Check the diagnostic script output
2. Review the test results
3. Check browser console for errors
4. Verify R2 bucket contents

The fixes address the most common causes of the "same image showing" issue. The diagnostic script will help identify any remaining problems.




