#!/usr/bin/env node

/**
 * Test Script: Image Upload & Persistence Fix
 * 
 * This script tests the fix for "no images show" issue by:
 * 1. Uploading test images
 * 2. Verifying they're persisted to the property document
 * 3. Checking that the property API returns the images
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  TEST_PROPERTY_ID: process.env.TEST_PROPERTY_ID || '1',
  TEST_IMAGES_DIR: path.join(__dirname, '../test-images')
};

class ImagePersistenceTester {
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
    console.log('🧪 Starting Image Persistence Tests...\n');
    
    try {
      // Test 1: Upload images with listingId
      await this.testImageUploadWithPersistence();
      
      // Test 2: Verify property document has images
      await this.testPropertyDocumentImages();
      
      // Test 3: Verify property API returns images
      await this.testPropertyApiImages();
      
      // Test 4: Test separate attach endpoint
      await this.testAttachEndpoint();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.summary.issues.push(`Test suite error: ${error.message}`);
    }
  }

  async testImageUploadWithPersistence() {
    console.log('🔍 Test 1: Image Upload with Persistence');
    
    try {
      // Create test images
      const testImages = this.createTestImages();
      
      const formData = new FormData();
      testImages.forEach((image, index) => {
        formData.append('files', image.buffer, {
          filename: `test-image-${index}.png`,
          contentType: 'image/png'
        });
      });
      formData.append('listingId', CONFIG.TEST_PROPERTY_ID);
      
      console.log(`   📤 Uploading ${testImages.length} test images with listingId: ${CONFIG.TEST_PROPERTY_ID}`);
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/upload-images`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': 'session=test-session' // You'll need to add proper auth
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.files && result.persisted) {
        console.log('   ✅ PASS: Images uploaded and persisted successfully');
        console.log(`   📊 Uploaded ${result.files.length} files, persisted: ${result.persisted}`);
        
        this.addTestResult('image_upload_persistence', {
          status: 'PASS',
          details: {
            uploadedFiles: result.files.length,
            persisted: result.persisted,
            urls: result.files.map(f => f.url)
          }
        });
      } else {
        console.log('   ❌ FAIL: Upload failed or not persisted');
        console.log('   📊 Result:', result);
        
        this.addTestResult('image_upload_persistence', {
          status: 'FAIL',
          details: { result }
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('image_upload_persistence', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testPropertyDocumentImages() {
    console.log('🔍 Test 2: Property Document Images');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const property = result.data;
        const hasImages = property.images && property.images.length > 0;
        const hasThumbnail = !!property.thumbnailImage;
        
        console.log(`   📊 Property images: ${property.images?.length || 0}`);
        console.log(`   📊 Has thumbnail: ${hasThumbnail}`);
        console.log(`   📊 Thumbnail URL: ${property.thumbnailImage || 'None'}`);
        
        if (hasImages || hasThumbnail) {
          console.log('   ✅ PASS: Property document contains images');
          
          this.addTestResult('property_document_images', {
            status: 'PASS',
            details: {
              imagesCount: property.images?.length || 0,
              hasThumbnail: hasThumbnail,
              thumbnailUrl: property.thumbnailImage,
              images: property.images
            }
          });
        } else {
          console.log('   ❌ FAIL: Property document has no images');
          
          this.addTestResult('property_document_images', {
            status: 'FAIL',
            details: {
              imagesCount: property.images?.length || 0,
              hasThumbnail: hasThumbnail,
              property: property
            }
          });
        }
      } else {
        console.log('   ❌ FAIL: Could not fetch property');
        
        this.addTestResult('property_document_images', {
          status: 'FAIL',
          error: result.error || 'Could not fetch property'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('property_document_images', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testPropertyApiImages() {
    console.log('🔍 Test 3: Property API Images');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}/images`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const { images, thumbnailImage, totalImages } = result.data;
        
        console.log(`   📊 Total images: ${totalImages}`);
        console.log(`   📊 Has thumbnail: ${!!thumbnailImage}`);
        console.log(`   📊 Images array: ${images?.length || 0}`);
        
        if (totalImages > 0) {
          console.log('   ✅ PASS: Property API returns images');
          
          this.addTestResult('property_api_images', {
            status: 'PASS',
            details: {
              totalImages,
              hasThumbnail: !!thumbnailImage,
              thumbnailUrl: thumbnailImage,
              images: images
            }
          });
        } else {
          console.log('   ❌ FAIL: Property API returns no images');
          
          this.addTestResult('property_api_images', {
            status: 'FAIL',
            details: result.data
          });
        }
      } else {
        console.log('   ❌ FAIL: Property images API failed');
        
        this.addTestResult('property_api_images', {
          status: 'FAIL',
          error: result.error || 'API failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('property_api_images', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testAttachEndpoint() {
    console.log('🔍 Test 4: Attach Images Endpoint');
    
    try {
      const testUrls = [
        'https://example.com/test-image-1.jpg',
        'https://example.com/test-image-2.jpg'
      ];
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=test-session'
        },
        body: JSON.stringify({
          images: testUrls,
          setAsThumbnail: true
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('   ✅ PASS: Attach endpoint works');
        console.log(`   📊 Attached ${result.data.totalImages} images`);
        
        this.addTestResult('attach_endpoint', {
          status: 'PASS',
          details: result.data
        });
      } else {
        console.log('   ❌ FAIL: Attach endpoint failed');
        
        this.addTestResult('attach_endpoint', {
          status: 'FAIL',
          error: result.error
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('attach_endpoint', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  createTestImages() {
    const testImages = [];
    
    for (let i = 0; i < 2; i++) {
      // Simple 1x1 PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
      ]);
      
      testImages.push({
        buffer: pngBuffer,
        name: `test-image-${i}.png`,
        size: pngBuffer.length
      });
    }
    
    return testImages;
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
    console.log('📋 IMAGE PERSISTENCE TEST RESULTS');
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
    
    // Final recommendation
    if (this.results.summary.failed === 0) {
      console.log('\n🎉 All tests passed! The image persistence fix is working correctly.');
      console.log('📸 Images should now show up in your property gallery.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the issues above.');
      console.log('🔧 Make sure to:');
      console.log('   1. Set TEST_PROPERTY_ID environment variable');
      console.log('   2. Ensure proper authentication');
      console.log('   3. Check that the property exists');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ImagePersistenceTester();
  tester.runTests().catch(console.error);
}

module.exports = ImagePersistenceTester;




