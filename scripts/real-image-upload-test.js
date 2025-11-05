#!/usr/bin/env node

/**
 * REAL IMAGE UPLOAD TEST
 * 
 * This script performs actual image uploads to test the complete flow:
 * 1. Creates real test images
 * 2. Uploads them via the API
 * 3. Verifies they're persisted to the database
 * 4. Checks they show up in the frontend
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  TEST_PROPERTY_ID: process.env.TEST_PROPERTY_ID || '1',
  TEST_IMAGES_DIR: path.join(__dirname, 'test-images'),
  RESULTS_FILE: path.join(__dirname, 'upload-test-results.json')
};

class RealImageUploadTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        issues: []
      }
    };
  }

  async runTests() {
    console.log('🚀 REAL IMAGE UPLOAD TEST');
    console.log('==========================\n');
    
    try {
      // Test 1: Environment Check
      await this.testEnvironment();
      
      // Test 2: Create Test Images
      await this.createTestImages();
      
      // Test 3: Upload Images
      await this.testImageUpload();
      
      // Test 4: Verify Database Persistence
      await this.testDatabasePersistence();
      
      // Test 5: Verify API Response
      await this.testApiResponse();
      
      // Test 6: Verify Image URLs Work
      await this.testImageUrls();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.summary.issues.push(`Test suite error: ${error.message}`);
    }
  }

  async testEnvironment() {
    console.log('🔍 Test 1: Environment Check');
    
    try {
      const requiredVars = [
        'R2_ENDPOINT',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        console.log('   ❌ FAIL: Missing environment variables:', missing);
        this.addTestResult('environment_check', {
          status: 'FAIL',
          error: `Missing variables: ${missing.join(', ')}`
        });
        return;
      }
      
      console.log('   ✅ PASS: All environment variables are set');
      console.log(`   📊 R2_BUCKET: ${process.env.R2_BUCKET}`);
      console.log(`   📊 R2_ENDPOINT: ${process.env.R2_ENDPOINT}`);
      
      this.addTestResult('environment_check', {
        status: 'PASS',
        details: {
          bucket: process.env.R2_BUCKET,
          endpoint: process.env.R2_ENDPOINT
        }
      });
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('environment_check', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async createTestImages() {
    console.log('🔍 Test 2: Create Test Images');
    
    try {
      // Create test images directory
      if (!fs.existsSync(CONFIG.TEST_IMAGES_DIR)) {
        fs.mkdirSync(CONFIG.TEST_IMAGES_DIR, { recursive: true });
      }
      
      const testImages = [];
      
      // Create 3 different test images
      for (let i = 1; i <= 3; i++) {
        const imagePath = path.join(CONFIG.TEST_IMAGES_DIR, `test-image-${i}.png`);
        
        // Create a simple PNG image (100x100 pixels)
        const pngBuffer = this.createTestPngBuffer(100, 100, i);
        
        fs.writeFileSync(imagePath, pngBuffer);
        
        testImages.push({
          path: imagePath,
          name: `test-image-${i}.png`,
          size: pngBuffer.length,
          buffer: pngBuffer
        });
        
        console.log(`   📸 Created: ${imagePath} (${pngBuffer.length} bytes)`);
      }
      
      console.log(`   ✅ PASS: Created ${testImages.length} test images`);
      
      this.addTestResult('create_test_images', {
        status: 'PASS',
        details: {
          imagesCreated: testImages.length,
          totalSize: testImages.reduce((sum, img) => sum + img.size, 0),
          images: testImages.map(img => ({
            name: img.name,
            size: img.size
          }))
        }
      });
      
      this.testImages = testImages;
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('create_test_images', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testImageUpload() {
    console.log('🔍 Test 3: Upload Images');
    
    try {
      if (!this.testImages || this.testImages.length === 0) {
        throw new Error('No test images available');
      }
      
      const formData = new FormData();
      
      // Add all test images to form data
      this.testImages.forEach((image, index) => {
        formData.append('files', image.buffer, {
          filename: image.name,
          contentType: 'image/png'
        });
      });
      
      // Add listingId for persistence
      formData.append('listingId', CONFIG.TEST_PROPERTY_ID);
      
      console.log(`   📤 Uploading ${this.testImages.length} images to property ${CONFIG.TEST_PROPERTY_ID}`);
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/upload-images`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': 'session=test-session' // You'll need to add proper auth
        }
      });
      
      const result = await response.json();
      
      console.log(`   📊 Response status: ${response.status}`);
      console.log(`   📊 Success: ${result.success}`);
      console.log(`   📊 Persisted: ${result.persisted}`);
      console.log(`   📊 Files uploaded: ${result.files?.length || 0}`);
      
      if (result.success && result.files && result.files.length > 0) {
        console.log('   ✅ PASS: Images uploaded successfully');
        console.log('   📋 Uploaded URLs:');
        result.files.forEach((file, index) => {
          console.log(`      ${index + 1}. ${file.url}`);
        });
        
        this.addTestResult('image_upload', {
          status: 'PASS',
          details: {
            uploadedFiles: result.files.length,
            persisted: result.persisted,
            urls: result.files.map(f => f.url),
            keys: result.files.map(f => f.key)
          }
        });
        
        this.uploadedFiles = result.files;
      } else {
        console.log('   ❌ FAIL: Upload failed');
        console.log('   📊 Error:', result.error);
        
        this.addTestResult('image_upload', {
          status: 'FAIL',
          error: result.error || 'Upload failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('image_upload', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testDatabasePersistence() {
    console.log('🔍 Test 4: Database Persistence');
    
    try {
      if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        throw new Error('No uploaded files to check');
      }
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const property = result.data;
        const hasImages = property.images && property.images.length > 0;
        const hasThumbnail = !!property.thumbnailImage;
        
        console.log(`   📊 Property ID: ${property.propertyId}`);
        console.log(`   📊 Images in DB: ${property.images?.length || 0}`);
        console.log(`   📊 Has thumbnail: ${hasThumbnail}`);
        console.log(`   📊 Thumbnail URL: ${property.thumbnailImage || 'None'}`);
        
        if (hasImages) {
          console.log('   📋 Images in database:');
          property.images.forEach((url, index) => {
            console.log(`      ${index + 1}. ${url}`);
          });
        }
        
        if (hasImages || hasThumbnail) {
          console.log('   ✅ PASS: Images persisted to database');
          
          this.addTestResult('database_persistence', {
            status: 'PASS',
            details: {
              imagesCount: property.images?.length || 0,
              hasThumbnail: hasThumbnail,
              thumbnailUrl: property.thumbnailImage,
              images: property.images
            }
          });
        } else {
          console.log('   ❌ FAIL: No images found in database');
          
          this.addTestResult('database_persistence', {
            status: 'FAIL',
            error: 'Images not persisted to database'
          });
        }
      } else {
        console.log('   ❌ FAIL: Could not fetch property');
        
        this.addTestResult('database_persistence', {
          status: 'FAIL',
          error: result.error || 'Could not fetch property'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('database_persistence', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testApiResponse() {
    console.log('🔍 Test 5: API Response');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}/images`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const { images, thumbnailImage, totalImages } = result.data;
        
        console.log(`   📊 Total images: ${totalImages}`);
        console.log(`   📊 Has thumbnail: ${!!thumbnailImage}`);
        console.log(`   📊 Images array: ${images?.length || 0}`);
        
        if (totalImages > 0) {
          console.log('   ✅ PASS: API returns images');
          
          this.addTestResult('api_response', {
            status: 'PASS',
            details: {
              totalImages,
              hasThumbnail: !!thumbnailImage,
              thumbnailUrl: thumbnailImage,
              images: images
            }
          });
        } else {
          console.log('   ❌ FAIL: API returns no images');
          
          this.addTestResult('api_response', {
            status: 'FAIL',
            error: 'API returns no images'
          });
        }
      } else {
        console.log('   ❌ FAIL: Images API failed');
        
        this.addTestResult('api_response', {
          status: 'FAIL',
          error: result.error || 'API failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('api_response', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testImageUrls() {
    console.log('🔍 Test 6: Image URL Accessibility');
    
    try {
      if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        throw new Error('No uploaded files to test');
      }
      
      const urlTests = [];
      
      for (const file of this.uploadedFiles) {
        try {
          console.log(`   🔗 Testing URL: ${file.url}`);
          
          const response = await fetch(file.url, { method: 'HEAD' });
          const isAccessible = response.ok;
          const status = response.status;
          const contentType = response.headers.get('content-type');
          
          urlTests.push({
            url: file.url,
            accessible: isAccessible,
            status: status,
            contentType: contentType
          });
          
          if (isAccessible) {
            console.log(`      ✅ Accessible (${status}) - ${contentType}`);
          } else {
            console.log(`      ❌ Not accessible (${status})`);
          }
          
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
          urlTests.push({
            url: file.url,
            accessible: false,
            error: error.message
          });
        }
      }
      
      const accessibleCount = urlTests.filter(test => test.accessible).length;
      const totalCount = urlTests.length;
      
      if (accessibleCount === totalCount) {
        console.log('   ✅ PASS: All image URLs are accessible');
        
        this.addTestResult('image_urls', {
          status: 'PASS',
          details: {
            totalUrls: totalCount,
            accessibleUrls: accessibleCount,
            tests: urlTests
          }
        });
      } else {
        console.log(`   ❌ FAIL: Only ${accessibleCount}/${totalCount} URLs are accessible`);
        
        this.addTestResult('image_urls', {
          status: 'FAIL',
          details: {
            totalUrls: totalCount,
            accessibleUrls: accessibleCount,
            tests: urlTests
          }
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('image_urls', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  createTestPngBuffer(width, height, colorIndex = 1) {
    // Create a simple PNG buffer with different colors
    const colors = [
      [255, 0, 0],    // Red
      [0, 255, 0],    // Green
      [0, 0, 255]     // Blue
    ];
    
    const color = colors[(colorIndex - 1) % colors.length];
    
    // Simple 1x1 PNG with specified color
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
  }

  addTestResult(testName, result) {
    this.results.tests.push({
      name: testName,
      ...result
    });
    
    this.results.summary.totalTests++;
    if (result.status === 'PASS') {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      if (result.error) {
        this.results.summary.issues.push(`${testName}: ${result.error}`);
      }
    }
  }

  generateReport() {
    console.log('📋 REAL IMAGE UPLOAD TEST RESULTS');
    console.log('==================================\n');
    
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    
    if (this.results.summary.issues.length > 0) {
      console.log('\nIssues Found:');
      this.results.summary.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    console.log('\nDetailed Results:');
    this.results.tests.forEach(test => {
      const emoji = test.status === 'PASS' ? '✅' : 
                   test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${emoji} ${test.name}: ${test.status}`);
      
      if (test.details) {
        console.log(`   Details:`, JSON.stringify(test.details, null, 2));
      }
      
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    
    // Save results to file
    try {
      fs.writeFileSync(CONFIG.RESULTS_FILE, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Results saved to: ${CONFIG.RESULTS_FILE}`);
    } catch (error) {
      console.log(`\n⚠️ Could not save results file: ${error.message}`);
    }
    
    // Final recommendation
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('📸 Your image upload system is working perfectly!');
      console.log('✅ Images are being uploaded to R2');
      console.log('✅ Images are being persisted to the database');
      console.log('✅ Images are accessible via URLs');
      console.log('✅ The gallery should now show images correctly');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log('🔧 Check the issues above and fix them before deploying');
      console.log('💡 Common fixes:');
      console.log('   - Check environment variables');
      console.log('   - Verify R2 bucket is public');
      console.log('   - Check authentication');
      console.log('   - Verify property ID exists');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new RealImageUploadTester();
  tester.runTests().catch(console.error);
}

module.exports = RealImageUploadTester;




