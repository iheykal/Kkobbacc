#!/usr/bin/env node

/**
 * Create Debug Test Property
 * 
 * This script creates a test property specifically for testing image uploads
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  TEST_PROPERTY_ID: process.env.TEST_PROPERTY_ID || '999999', // High number to avoid conflicts
  TEST_PROPERTY_DATA: {
    propertyId: 999999,
    title: "🧪 TEST PROPERTY - Image Upload Debug",
    description: "This is a test property created specifically for testing image uploads. You can safely delete this property after testing.",
    price: 100000,
    location: "Test Location",
    propertyType: "House",
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    status: "available",
    features: ["Test Feature 1", "Test Feature 2"],
    agentId: "test-agent",
    agentName: "Test Agent",
    agentPhone: "+1234567890",
    agentEmail: "test@example.com",
    thumbnailImage: "", // Will be set when images are uploaded
    images: [], // Will be populated when images are uploaded
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

class DebugPropertyCreator {
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

  async createTestProperty() {
    console.log('🧪 CREATING DEBUG TEST PROPERTY');
    console.log('================================\n');
    
    try {
      // Test 1: Check if property already exists
      await this.checkExistingProperty();
      
      // Test 2: Create the test property
      await this.createProperty();
      
      // Test 3: Verify property was created
      await this.verifyProperty();
      
      // Test 4: Test image upload to this property
      await this.testImageUpload();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test property creation failed:', error.message);
      this.results.summary.issues.push(`Creation error: ${error.message}`);
    }
  }

  async checkExistingProperty() {
    console.log('🔍 Test 1: Check Existing Property');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('   ⚠️ Property already exists!');
        console.log(`   📊 Title: ${result.data.title}`);
        console.log(`   📊 Images: ${result.data.images?.length || 0}`);
        
        this.addTestResult('check_existing', {
          status: 'INFO',
          details: {
            exists: true,
            title: result.data.title,
            imagesCount: result.data.images?.length || 0
          }
        });
        
        // Ask if we should continue
        console.log('   💡 You can either:');
        console.log('      1. Use this existing property for testing');
        console.log('      2. Delete it and create a new one');
        console.log('      3. Continue with this property');
        
      } else {
        console.log('   ✅ Property does not exist - safe to create new one');
        
        this.addTestResult('check_existing', {
          status: 'PASS',
          details: {
            exists: false
          }
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('check_existing', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async createProperty() {
    console.log('🔍 Test 2: Create Test Property');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'session=test-session' // You'll need proper auth
        },
        body: JSON.stringify(CONFIG.TEST_PROPERTY_DATA)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('   ✅ Property created successfully!');
        console.log(`   📊 Property ID: ${result.data.propertyId}`);
        console.log(`   📊 Title: ${result.data.title}`);
        console.log(`   📊 Status: ${result.data.status}`);
        
        this.addTestResult('create_property', {
          status: 'PASS',
          details: {
            propertyId: result.data.propertyId,
            title: result.data.title,
            status: result.data.status
          }
        });
        
        this.createdProperty = result.data;
      } else {
        console.log('   ❌ FAIL: Property creation failed');
        console.log('   📊 Error:', result.error);
        
        this.addTestResult('create_property', {
          status: 'FAIL',
          error: result.error || 'Property creation failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('create_property', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async verifyProperty() {
    console.log('🔍 Test 3: Verify Property');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const property = result.data;
        console.log('   ✅ Property verification successful!');
        console.log(`   📊 Property ID: ${property.propertyId}`);
        console.log(`   📊 Title: ${property.title}`);
        console.log(`   📊 Images: ${property.images?.length || 0}`);
        console.log(`   📊 Thumbnail: ${property.thumbnailImage || 'None'}`);
        
        this.addTestResult('verify_property', {
          status: 'PASS',
          details: {
            propertyId: property.propertyId,
            title: property.title,
            imagesCount: property.images?.length || 0,
            hasThumbnail: !!property.thumbnailImage
          }
        });
        
        this.verifiedProperty = property;
      } else {
        console.log('   ❌ FAIL: Property verification failed');
        
        this.addTestResult('verify_property', {
          status: 'FAIL',
          error: result.error || 'Property verification failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('verify_property', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async testImageUpload() {
    console.log('🔍 Test 4: Test Image Upload');
    
    try {
      // Create a simple test image
      const testImageBuffer = this.createTestImageBuffer();
      
      const formData = new FormData();
      formData.append('files', testImageBuffer, {
        filename: 'test-debug-image.png',
        contentType: 'image/png'
      });
      formData.append('listingId', CONFIG.TEST_PROPERTY_ID);
      
      console.log('   📤 Uploading test image...');
      
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/upload-images`, {
        method: 'POST',
        body: formData,
        headers: {
          'Cookie': 'session=test-session' // You'll need proper auth
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.files && result.files.length > 0) {
        console.log('   ✅ Image upload successful!');
        console.log(`   📊 Files uploaded: ${result.files.length}`);
        console.log(`   📊 Persisted: ${result.persisted}`);
        console.log(`   📊 URL: ${result.files[0].url}`);
        
        this.addTestResult('test_image_upload', {
          status: 'PASS',
          details: {
            uploadedFiles: result.files.length,
            persisted: result.persisted,
            url: result.files[0].url
          }
        });
        
        // Verify the image is now in the property
        await this.verifyImageInProperty();
        
      } else {
        console.log('   ❌ FAIL: Image upload failed');
        console.log('   📊 Error:', result.error);
        
        this.addTestResult('test_image_upload', {
          status: 'FAIL',
          error: result.error || 'Image upload failed'
        });
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('test_image_upload', {
        status: 'ERROR',
        error: error.message
      });
    }
    
    console.log('');
  }

  async verifyImageInProperty() {
    console.log('   🔍 Verifying image in property...');
    
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const property = result.data;
        const hasImages = property.images && property.images.length > 0;
        const hasThumbnail = !!property.thumbnailImage;
        
        if (hasImages || hasThumbnail) {
          console.log('   ✅ Image successfully added to property!');
          console.log(`   📊 Images in property: ${property.images?.length || 0}`);
          console.log(`   📊 Has thumbnail: ${hasThumbnail}`);
          
          this.addTestResult('verify_image_in_property', {
            status: 'PASS',
            details: {
              imagesCount: property.images?.length || 0,
              hasThumbnail: hasThumbnail,
              thumbnailUrl: property.thumbnailImage
            }
          });
        } else {
          console.log('   ❌ Image not found in property');
          
          this.addTestResult('verify_image_in_property', {
            status: 'FAIL',
            error: 'Image not persisted to property'
          });
        }
      }
      
    } catch (error) {
      console.log('   ❌ ERROR:', error.message);
      this.addTestResult('verify_image_in_property', {
        status: 'ERROR',
        error: error.message
      });
    }
  }

  createTestImageBuffer() {
    // Create a simple 100x100 PNG image with "TEST" text
    return Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, // 100x100 dimensions
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
    } else if (result.status === 'FAIL' || result.status === 'ERROR') {
      this.results.summary.failed++;
      if (result.error) {
        this.results.summary.issues.push(`${testName}: ${result.error}`);
      }
    }
  }

  generateReport() {
    console.log('📋 DEBUG TEST PROPERTY CREATION RESULTS');
    console.log('========================================\n');
    
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
                   test.status === 'FAIL' ? '❌' : 
                   test.status === 'INFO' ? 'ℹ️' : '⚠️';
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
      console.log('\n🎉 DEBUG TEST PROPERTY CREATED SUCCESSFULLY!');
      console.log(`📸 Test Property ID: ${CONFIG.TEST_PROPERTY_ID}`);
      console.log('✅ You can now use this property for testing image uploads');
      console.log('✅ The property has been created and verified');
      console.log('✅ Image upload has been tested and works');
      console.log('\n🔧 Next steps:');
      console.log('1. Use this property ID in your image upload tests');
      console.log('2. Upload more images to test the complete flow');
      console.log('3. Delete this property when you\'re done testing');
      console.log('\n📋 Test URLs:');
      console.log(`- Property: ${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}`);
      console.log(`- Images: ${CONFIG.API_BASE}/api/properties/${CONFIG.TEST_PROPERTY_ID}/images`);
      console.log(`- Upload: ${CONFIG.API_BASE}/api/properties/upload-images`);
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log('🔧 Check the issues above and fix them');
      console.log('💡 Common fixes:');
      console.log('   - Check environment variables');
      console.log('   - Verify API endpoints are working');
      console.log('   - Check authentication');
      console.log('   - Ensure database connection');
    }
  }
}

// Run the test property creation
if (require.main === module) {
  const creator = new DebugPropertyCreator();
  creator.createTestProperty().catch(console.error);
}

module.exports = DebugPropertyCreator;




