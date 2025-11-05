# 🧪 COMPLETE IMAGE UPLOAD TEST GUIDE

## 🚀 Quick Start (2 minutes)

### Option 1: Automated Test
```bash
# 1. Create debug property
node scripts/create-debug-property.js

# 2. Run comprehensive test
node scripts/real-image-upload-test.js
```

### Option 2: Manual Test (Recommended)
```bash
# 1. Start dev server with network access
node scripts/start-dev-network.js

# 2. Open test page in browser
# Local: http://localhost:3000/test-image-upload.html
# Network: http://192.168.100.32:3000/test-image-upload.html
```

## 📋 What You Get

### 🧪 Debug Test Property
- **Property ID**: 999999 (or custom)
- **Title**: "🧪 TEST PROPERTY - Image Upload Debug"
- **Purpose**: Safe testing without affecting real properties
- **Features**: All required fields for testing

### 🔧 Test Tools
1. **Real Image Upload Test** (`scripts/real-image-upload-test.js`)
   - Creates actual test images
   - Uploads them via API
   - Verifies database persistence
   - Tests image URL accessibility

2. **HTML Test Page** (`test-image-upload.html`)
   - Visual interface for testing
   - Upload multiple images
   - Check property database
   - Test image URLs
   - Create debug property

3. **Debug Property Creator** (`scripts/create-debug-property.js`)
   - Creates test property automatically
   - Tests image upload to new property
   - Verifies complete flow

## 🎯 Step-by-Step Testing

### Step 1: Create Debug Property
```bash
# Run the debug property creator
node scripts/create-debug-property.js
```

**Expected Output:**
```
🧪 CREATING DEBUG TEST PROPERTY
================================

🔍 Test 1: Check Existing Property
   ✅ Property does not exist - safe to create new one

🔍 Test 2: Create Test Property
   ✅ Property created successfully!
   📊 Property ID: 999999
   📊 Title: 🧪 TEST PROPERTY - Image Upload Debug

🔍 Test 3: Verify Property
   ✅ Property verification successful!

🔍 Test 4: Test Image Upload
   ✅ Image upload successful!
   📊 Files uploaded: 1
   📊 Persisted: true

🎉 DEBUG TEST PROPERTY CREATED SUCCESSFULLY!
```

### Step 2: Test Image Upload
```bash
# Set the test property ID
export TEST_PROPERTY_ID="999999"

# Run the comprehensive test
node scripts/real-image-upload-test.js
```

**Expected Output:**
```
🚀 REAL IMAGE UPLOAD TEST
==========================

🔍 Test 1: Environment Check
   ✅ PASS: All environment variables are set

🔍 Test 2: Create Test Images
   ✅ PASS: Created 3 test images

🔍 Test 3: Upload Images
   ✅ PASS: Images uploaded successfully
   📋 Uploaded URLs:
      1. https://bucket.r2.dev/properties/999999/image1.webp
      2. https://bucket.r2.dev/properties/999999/image2.webp

🔍 Test 4: Database Persistence
   ✅ PASS: Images persisted to database

🔍 Test 5: API Response
   ✅ PASS: API returns images

🔍 Test 6: Image URL Accessibility
   ✅ PASS: All image URLs are accessible

🎉 ALL TESTS PASSED!
```

### Step 3: Manual Testing (Optional)
1. **Start dev server with network access:**
   ```bash
   node scripts/start-dev-network.js
   ```

2. **Open test page:**
   - Local: `http://localhost:3000/test-image-upload.html`
   - Network: `http://192.168.100.32:3000/test-image-upload.html`

3. **Follow the on-screen instructions:**
   - Create debug property
   - Upload test images
   - Check property database
   - Test image URLs

## 🔍 What Each Test Verifies

### ✅ Environment Check
- R2_ENDPOINT is set
- R2_ACCESS_KEY_ID is set
- R2_SECRET_ACCESS_KEY is set
- R2_BUCKET is set

### ✅ Image Creation
- Creates 3 test PNG images
- Different colors for each image
- Proper file format and size

### ✅ Image Upload
- Files are uploaded to R2
- WebP conversion works
- Unique keys are generated
- URLs are returned correctly

### ✅ Database Persistence
- URLs are saved to Property.images
- Thumbnail is set if empty
- No duplicates are created
- Property is updated correctly

### ✅ API Response
- Property API returns images
- Images API works correctly
- Cache headers are set
- Data is fresh (not cached)

### ✅ Image URL Accessibility
- URLs are accessible via HTTP
- Images load correctly
- No 403/404 errors
- Proper content-type headers

## 🚨 Troubleshooting

### Common Issues & Fixes

#### 1. Environment Variables Missing
```bash
# Check if variables are set
echo $R2_ENDPOINT
echo $R2_BUCKET

# Set them if missing
export R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
export R2_BUCKET="your-bucket-name"
```

#### 2. Property ID Conflicts
```bash
# Use a different property ID
export TEST_PROPERTY_ID="888888"
node scripts/create-debug-property.js
```

#### 3. R2 Bucket Not Public
- Check Cloudflare R2 settings
- Ensure bucket is publicly accessible
- Verify R2_PUBLIC_BASE_URL is correct

#### 4. Authentication Issues
- Make sure you're logged in
- Check session cookies
- Verify API endpoints are accessible

#### 5. Network Access Issues
```bash
# Check if port is accessible
telnet 192.168.100.32 3000

# Check firewall settings
# Windows: Windows Defender Firewall
# Mac: System Preferences > Security & Privacy
```

## 📊 Success Indicators

### ✅ All Tests Pass
```
🎉 ALL TESTS PASSED!
📸 Your image upload system is working perfectly!
✅ Images are being uploaded to R2
✅ Images are being persisted to the database
✅ Images are accessible via URLs
✅ The gallery should now show images correctly
```

### ✅ Manual Test Success
- Debug property is created
- Images upload successfully
- Property shows uploaded images
- Image URLs are accessible
- Gallery displays images correctly

## 🧹 Cleanup

### After Testing
```bash
# Delete the debug property (optional)
# You can do this via the admin panel or API
curl -X DELETE http://localhost:3000/api/properties/999999
```

### Test Files
```bash
# Clean up test images
rm -rf test-images/
rm -f upload-test-results.json
```

## 🎯 Next Steps

1. **If tests pass**: Your image upload system is working! 🎉
2. **If tests fail**: Check the error messages and fix the issues
3. **For production**: Use the same test process on your production environment
4. **For monitoring**: Set up automated tests to run regularly

## 📞 Support

If you encounter issues:
1. Check the error messages in the test output
2. Verify environment variables are set correctly
3. Ensure R2 bucket is properly configured
4. Check network connectivity and firewall settings
5. Review the troubleshooting section above

---

**🎉 Happy Testing! Your image upload system should now be working perfectly!**




