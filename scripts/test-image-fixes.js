#!/usr/bin/env node

/**
 * Test Script for Image Upload Fixes
 * 
 * This script tests the fixes for the "same image showing" issue
 * by uploading multiple test images and verifying they're unique.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  TEST_IMAGES_DIR: path.join(__dirname, '../test-images'),
  RESULTS_FILE: path.join(__dirname, '../test-results.json')
};

class ImageUploadTester {
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
    console.log('🧪 Starting Image Upload Tests...\n');
    
    try {
      // Test 1: Unique Key Generation
      await this.testUniqueKeyGeneration();
      
      // Test 2: Upload Multiple Images
      await this.testMultipleImageUpload();
      
      // Test 3: Cache Busting
      await this.testCacheBusting();
      
      // Test 4: URL Uniqueness
      await this.testUrlUniqueness();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.results.summary.issues.push(`Test suite error: ${error.message}`);
    }
  }

  async testUniqueKeyGeneration() {
    console.log('🔍 Test 1: Unique Key Generation');
    
    try {
      const { generateUniqueKey } = require('../src/lib/uniqueKeyGenerator');
      
      const keys = [];
      for (let i = 0; i < 10; i++) {
        const key = generateUniqueKey('test', `image${i}.jpg`);
        keys.push(key);
      }
      
      const uniqueKeys = new Set(keys);
      const allUnique = uniqueKeys.size === keys.length;
      
      this.addTestResult('unique_key_generation', {
        status: allUnique ? 'PASS' : 'FAIL',
        details: {
          totalKeys: keys.length,
          uniqueKeys: uniqueKeys.size,
          allUnique: allUnique,
          sampleKeys: keys.slice(0, 3)
        }
      });
      
      if (allUnique) {
        console.log('   ✅ PASS: All generated keys are unique');
      } else {
        console.log('   ❌ FAIL: Duplicate keys detected');
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('unique_key_generation', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testMultipleImageUpload() {
    console.log('🔍 Test 2: Multiple Image Upload');
    
    try {
      // Create test images (small PNG files)
      const testImages = this.createTestImages();
      
      const formData = new FormData();
      testImages.forEach((image, index) => {
        formData.append('files', image.buffer, {
          filename: `test-image-${index}.png`,
          contentType: 'image/png'
        });
      });
      formData.append('listingId', 'test-listing-' + Date.now());
      
      console.log(`   📤 Uploading ${testImages.length} test images...`);
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/upload-images-fixed`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': 'session=test-session' // You'll need to add proper auth
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.files) {
        const urls = result.files.map(f => f.url);
        const uniqueUrls = new Set(urls);
        const allUrlsUnique = uniqueUrls.size === urls.length;
        
        this.addTestResult('multiple_image_upload', {
          status: allUrlsUnique ? 'PASS' : 'FAIL',
          details: {
            uploadedFiles: result.files.length,
            uniqueUrls: uniqueUrls.size,
            allUrlsUnique: allUrlsUnique,
            urls: urls,
            summary: result.summary
          }
        });
        
        if (allUrlsUnique) {
          console.log('   ✅ PASS: All uploaded images have unique URLs');
        } else {
          console.log('   ❌ FAIL: Duplicate URLs detected');
        }
      } else {
        console.log('   ❌ FAIL: Upload failed:', result.error);
        this.addTestResult('multiple_image_upload', {
          status: 'FAIL',
          error: result.error
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('multiple_image_upload', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testCacheBusting() {
    console.log('🔍 Test 3: Cache Busting');
    
    try {
      const { addCacheBuster, addPropertyCacheBuster } = require('../src/lib/cacheBuster');
      
      const testUrl = 'https://example.com/image.jpg';
      const property = {
        updatedAt: new Date('2024-01-01'),
        _id: 'test-id-123',
        propertyId: 456
      };
      
      // Test basic cache busting
      const basicBusted = addCacheBuster(testUrl);
      const hasBasicBuster = basicBusted.includes('?v=');
      
      // Test property cache busting
      const propertyBusted = addPropertyCacheBuster(testUrl, property);
      const hasPropertyBuster = propertyBusted.includes('?v=');
      
      this.addTestResult('cache_busting', {
        status: (hasBasicBuster && hasPropertyBuster) ? 'PASS' : 'FAIL',
        details: {
          originalUrl: testUrl,
          basicBusted: basicBusted,
          propertyBusted: propertyBusted,
          hasBasicBuster: hasBasicBuster,
          hasPropertyBuster: hasPropertyBuster
        }
      });
      
      if (hasBasicBuster && hasPropertyBuster) {
        console.log('   ✅ PASS: Cache busting working correctly');
      } else {
        console.log('   ❌ FAIL: Cache busting not working');
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('cache_busting', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testUrlUniqueness() {
    console.log('🔍 Test 4: URL Uniqueness Validation');
    
    try {
      const testUrls = [
        'https://bucket.r2.dev/properties/session1/123-abc-image1.webp?v=1234567890',
        'https://bucket.r2.dev/properties/session1/124-def-image2.webp?v=1234567891',
        'https://bucket.r2.dev/properties/session1/125-ghi-image3.webp?v=1234567892'
      ];
      
      const uniqueUrls = new Set(testUrls);
      const allUnique = uniqueUrls.size === testUrls.length;
      
      // Check if URLs differ in key (before cache buster)
      const keys = testUrls.map(url => {
        const match = url.match(/\/properties\/[^?]+/);
        return match ? match[0] : url;
      });
      const uniqueKeys = new Set(keys);
      const allKeysUnique = uniqueKeys.size === keys.length;
      
      this.addTestResult('url_uniqueness', {
        status: (allUnique && allKeysUnique) ? 'PASS' : 'FAIL',
        details: {
          testUrls: testUrls,
          uniqueUrls: uniqueUrls.size,
          allUnique: allUnique,
          keys: keys,
          uniqueKeys: uniqueKeys.size,
          allKeysUnique: allKeysUnique
        }
      });
      
      if (allUnique && allKeysUnique) {
        console.log('   ✅ PASS: All URLs and keys are unique');
      } else {
        console.log('   ❌ FAIL: Duplicate URLs or keys detected');
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('url_uniqueness', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  createTestImages() {
    // Create simple test PNG images (1x1 pixel)
    const testImages = [];
    
    for (let i = 0; i < 3; i++) {
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
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
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
      console.log('\n🎉 All tests passed! The image upload fixes should work correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Review the issues above and fix them before deploying.');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ImageUploadTester();
  tester.runTests().catch(console.error);
}

module.exports = ImageUploadTester;




