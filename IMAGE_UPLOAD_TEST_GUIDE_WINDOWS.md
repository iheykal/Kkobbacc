# 🧪 COMPLETE IMAGE UPLOAD TEST GUIDE - WINDOWS CMD VERSION

## 🚀 Quick Start (2 minutes)

### Option 1: Automated Test
```cmd
REM 1. Create debug property
create-debug-property.cmd

REM 2. Run comprehensive test
real-image-upload-test.cmd
```

### Option 2: Manual Test (Recommended)
```cmd
REM 1. Start dev server with network access
start-dev-network.cmd

REM 2. Open test page in browser
REM Local: http://localhost:3000/test-image-upload.html
REM Network: http://192.168.100.32:3000/test-image-upload.html
```

## 📋 What You Get

### 🧪 Debug Test Property
- **Property ID**: 999999 (or custom)
- **Title**: "🧪 TEST PROPERTY - Image Upload Debug"
- **Purpose**: Safe testing without affecting real properties
- **Features**: All required fields for testing

### 🔧 Test Tools (Windows CMD)
1. **create-debug-property.cmd** - Creates test property automatically
2. **real-image-upload-test.cmd** - Comprehensive image upload test
3. **start-dev-network.cmd** - Starts dev server with network access
4. **setup-image-tests.cmd** - One-time setup for all dependencies
5. **test-image-upload.html** - Visual interface for testing

## 🎯 Step-by-Step Testing

### Step 1: Setup (One-time)
```cmd
REM Run setup script
setup-image-tests.cmd
```

**Expected Output:**
```
🚀 Setting up Image Upload Tests...
===================================

✅ Found package.json - running from project root
📦 Installing test dependencies...
✅ Dependencies installed successfully
📁 Creating test images directory...
✅ Created test-images directory
📄 Creating environment template...
✅ Created .env.test template
🎉 Setup complete!
```

### Step 2: Create Debug Property
```cmd
REM Run the debug property creator
create-debug-property.cmd
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

🔍 Test 3: Verify Property
   ✅ Property verification successful!

🔍 Test 4: Test Image Upload
   ✅ Image upload successful!
   📊 Files uploaded: 1
   📊 Persisted: true

🎉 DEBUG TEST PROPERTY CREATED SUCCESSFULLY!
```

### Step 3: Test Image Upload
```cmd
REM Run the comprehensive test
real-image-upload-test.cmd
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

🔍 Test 4: Database Persistence
   ✅ PASS: Images persisted to database

🔍 Test 5: API Response
   ✅ PASS: API returns images

🔍 Test 6: Image URL Accessibility
   ✅ PASS: Image URLs are accessible

🎉 ALL TESTS PASSED!
```

### Step 4: Manual Testing (Optional)
```cmd
REM Start dev server with network access
start-dev-network.cmd
```

**Expected Output:**
```
🚀 Starting Next.js Dev Server with Network Access
================================================

📡 Local access: http://localhost:3000
🌐 Network access: http://192.168.100.32:3000
🧪 Test page: http://192.168.100.32:3000/test-image-upload.html

🚀 Starting server...
```

Then open: `http://192.168.100.32:3000/test-image-upload.html`

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
```cmd
REM Check if variables are set
echo %R2_ENDPOINT%
echo %R2_BUCKET%

REM Set them if missing
set R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
set R2_BUCKET=your-bucket-name
```

#### 2. Property ID Conflicts
```cmd
REM Use a different property ID
set TEST_PROPERTY_ID=888888
create-debug-property.cmd
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
```cmd
REM Check if port is accessible
telnet 192.168.100.32 3000

REM Check firewall settings
REM Windows: Windows Defender Firewall
REM Allow Node.js through firewall
```

#### 6. curl Not Found
```cmd
REM Install curl (if not available)
REM Download from: https://curl.se/download.html
REM Or use PowerShell instead:
powershell -Command "Invoke-RestMethod -Uri 'http://localhost:3000/api/properties/999999'"
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
```cmd
REM Delete the debug property (optional)
REM You can do this via the admin panel or API
curl -X DELETE http://localhost:3000/api/properties/999999
```

### Test Files
```cmd
REM Clean up test images
rmdir /s /q test-images
del upload-test-results.json
del temp_*.json
del temp_*.hex
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

## 🔧 Windows-Specific Notes

### PowerShell Alternative
If CMD doesn't work well, you can use PowerShell:
```powershell
# Start dev server
npm run dev

# Test API
Invoke-RestMethod -Uri "http://localhost:3000/api/properties/999999"
```

### Windows Firewall
Make sure to allow Node.js through Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Add Node.js or allow port 3000

### Environment Variables
Set environment variables in Windows:
```cmd
REM Temporary (current session)
set R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com

REM Permanent (system-wide)
setx R2_ENDPOINT "https://your-account.r2.cloudflarestorage.com"
```

---

**🎉 Happy Testing! Your image upload system should now be working perfectly!**




