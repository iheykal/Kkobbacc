#!/usr/bin/env node

/**
 * Image Upload Issue Diagnostic Script
 * 
 * This script helps identify which of the 7 suspects is causing
 * the "same image showing" issue in your property uploads.
 * 
 * Usage: node scripts/diagnose-image-issue.js
 */

const https = require('https');
const http = require('http');

// Configuration - Update these with your actual values
const CONFIG = {
  // Your API base URL
  API_BASE: process.env.API_BASE || 'http://localhost:3000',
  
  // Sample property ID to test (replace with actual property ID)
  TEST_PROPERTY_ID: process.env.TEST_PROPERTY_ID || '1',
  
  // R2 bucket name (if you want to check bucket contents)
  R2_BUCKET: process.env.R2_BUCKET || 'your-bucket-name',
  
  // Sample image URLs that are showing the same image
  SAMPLE_URLS: [
    'https://your-bucket.r2.dev/properties/session1/image1.webp',
    'https://your-bucket.r2.dev/properties/session1/image2.webp'
  ]
};

class ImageIssueDiagnostic {
  constructor() {
    this.results = {
      suspect1_keyCollision: null,
      suspect2_backendResponse: null,
      suspect3_cdnCaching: null,
      suspect4_frontendState: null,
      suspect5_sharpProcessing: null,
      suspect6_nextjsCaching: null,
      suspect7_dbWriteMerge: null
    };
  }

  async runDiagnosis() {
    console.log('🔍 Starting Image Upload Issue Diagnosis...\n');
    
    try {
      // Test 1: Check backend response for unique URLs
      await this.checkBackendResponse();
      
      // Test 2: Check database document for unique image URLs
      await this.checkDatabaseDocument();
      
      // Test 3: Check if URLs actually serve different content
      await this.checkUrlContent();
      
      // Test 4: Check R2 bucket for unique keys (if accessible)
      await this.checkR2Bucket();
      
      // Generate diagnosis report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error.message);
    }
  }

  async checkBackendResponse() {
    console.log('🔍 Testing Suspect #2: Backend Response Mapping');
    
    try {
      // This would be a test upload - you'll need to implement this
      // For now, we'll check the debug endpoint
      const response = await this.makeRequest(`/api/debug-property-images?propertyId=${CONFIG.TEST_PROPERTY_ID}`);
      
      if (response.success) {
        const { resolvedUrls } = response.data.resolutionTest;
        
        console.log(`   📊 Found ${resolvedUrls.count} resolved URLs`);
        console.log(`   📋 URLs:`, resolvedUrls.urls);
        
        // Check if all URLs are identical
        const uniqueUrls = new Set(resolvedUrls.urls);
        this.results.suspect2_backendResponse = {
          status: uniqueUrls.size === 1 ? 'SUSPECTED' : 'CLEAR',
          details: {
            totalUrls: resolvedUrls.count,
            uniqueUrls: uniqueUrls.size,
            allIdentical: uniqueUrls.size === 1,
            urls: resolvedUrls.urls
          }
        };
        
        if (uniqueUrls.size === 1) {
          console.log('   ⚠️  SUSPECTED: All URLs are identical!');
        } else {
          console.log('   ✅ CLEAR: URLs are unique');
        }
      }
    } catch (error) {
      console.log('   ❌ Could not check backend response:', error.message);
      this.results.suspect2_backendResponse = { status: 'ERROR', error: error.message };
    }
    
    console.log('');
  }

  async checkDatabaseDocument() {
    console.log('🔍 Testing Suspect #7: Database Write Merge');
    
    try {
      const response = await this.makeRequest(`/api/debug-property-images?propertyId=${CONFIG.TEST_PROPERTY_ID}`);
      
      if (response.success) {
        const { imageAnalysis } = response.data;
        
        console.log(`   📊 Thumbnail Image: ${imageAnalysis.thumbnailImage.value || 'None'}`);
        console.log(`   📊 Images Array Length: ${imageAnalysis.images.length}`);
        console.log(`   📋 Images Array:`, imageAnalysis.images.items.map(item => item.value));
        
        // Check if all images in array are the same as thumbnail
        const imagesArray = imageAnalysis.images.items.map(item => item.value);
        const thumbnailValue = imageAnalysis.thumbnailImage.value;
        
        const allSameAsThumbnail = imagesArray.every(img => img === thumbnailValue);
        const allIdentical = imagesArray.length > 1 && new Set(imagesArray).size === 1;
        
        this.results.suspect7_dbWriteMerge = {
          status: allSameAsThumbnail || allIdentical ? 'SUSPECTED' : 'CLEAR',
          details: {
            thumbnailImage: thumbnailValue,
            imagesArray: imagesArray,
            allSameAsThumbnail: allSameAsThumbnail,
            allIdentical: allIdentical
          }
        };
        
        if (allSameAsThumbnail) {
          console.log('   ⚠️  SUSPECTED: All images array items match thumbnail!');
        } else if (allIdentical) {
          console.log('   ⚠️  SUSPECTED: All images array items are identical!');
        } else {
          console.log('   ✅ CLEAR: Images array contains unique values');
        }
      }
    } catch (error) {
      console.log('   ❌ Could not check database document:', error.message);
      this.results.suspect7_dbWriteMerge = { status: 'ERROR', error: error.message };
    }
    
    console.log('');
  }

  async checkUrlContent() {
    console.log('🔍 Testing Suspect #1 & #3: Key Collision & CDN Caching');
    
    if (CONFIG.SAMPLE_URLS.length < 2) {
      console.log('   ⚠️  No sample URLs provided for testing');
      return;
    }
    
    try {
      const url1 = CONFIG.SAMPLE_URLS[0];
      const url2 = CONFIG.SAMPLE_URLS[1];
      
      console.log(`   📊 Testing URL 1: ${url1}`);
      console.log(`   📊 Testing URL 2: ${url2}`);
      
      // Check if URLs are identical
      if (url1 === url2) {
        this.results.suspect1_keyCollision = {
          status: 'SUSPECTED',
          details: { reason: 'URLs are identical' }
        };
        console.log('   ⚠️  SUSPECTED: URLs are identical (key collision)');
        return;
      }
      
      // Try to fetch headers to check if content is different
      const headers1 = await this.fetchHeaders(url1);
      const headers2 = await this.fetchHeaders(url2);
      
      const etag1 = headers1['etag'] || headers1['ETag'];
      const etag2 = headers2['etag'] || headers2['ETag'];
      const size1 = headers1['content-length'] || headers1['Content-Length'];
      const size2 = headers2['content-length'] || headers2['Content-Length'];
      
      console.log(`   📊 ETag 1: ${etag1}, Size: ${size1}`);
      console.log(`   📊 ETag 2: ${etag2}, Size: ${size2}`);
      
      const sameContent = etag1 === etag2 && size1 === size2;
      
      this.results.suspect1_keyCollision = {
        status: sameContent ? 'SUSPECTED' : 'CLEAR',
        details: { etag1, etag2, size1, size2, sameContent }
      };
      
      this.results.suspect3_cdnCaching = {
        status: sameContent ? 'POSSIBLE' : 'CLEAR',
        details: { etag1, etag2, size1, size2, sameContent }
      };
      
      if (sameContent) {
        console.log('   ⚠️  SUSPECTED: Same ETag and size (key collision or caching)');
      } else {
        console.log('   ✅ CLEAR: Different ETags and sizes');
      }
      
    } catch (error) {
      console.log('   ❌ Could not check URL content:', error.message);
      this.results.suspect1_keyCollision = { status: 'ERROR', error: error.message };
    }
    
    console.log('');
  }

  async checkR2Bucket() {
    console.log('🔍 Testing Suspect #1: R2 Bucket Key Uniqueness');
    console.log('   ⚠️  Manual check required:');
    console.log('   1. Open your Cloudflare R2 dashboard');
    console.log('   2. Navigate to your bucket:', CONFIG.R2_BUCKET);
    console.log('   3. Look for properties/ folder');
    console.log('   4. Check if uploaded files have unique keys');
    console.log('   5. Verify different files have different ETags/sizes');
    console.log('');
  }

  async fetchHeaders(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.request(url, { method: 'HEAD' }, (res) => {
        resolve(res.headers);
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${CONFIG.API_BASE}${path}`;
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.request(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  generateReport() {
    console.log('📋 DIAGNOSIS REPORT');
    console.log('==================\n');
    
    const suspects = [
      { id: 1, name: 'Key Collision / Overwriting in R2', result: this.results.suspect1_keyCollision },
      { id: 2, name: 'Backend Response Maps Same URL', result: this.results.suspect2_backendResponse },
      { id: 3, name: 'CDN/Browser Caching Stale Asset', result: this.results.suspect3_cdnCaching },
      { id: 4, name: 'Frontend State Bug', result: this.results.suspect4_frontendState },
      { id: 5, name: 'Sharp Processing Loop Reuse', result: this.results.suspect5_sharpProcessing },
      { id: 6, name: 'Next.js Image Caching Quirks', result: this.results.suspect6_nextjsCaching },
      { id: 7, name: 'DB Write Merges Thumbnail', result: this.results.suspect7_dbWriteMerge }
    ];
    
    suspects.forEach(suspect => {
      const status = suspect.result?.status || 'NOT_TESTED';
      const emoji = status === 'SUSPECTED' ? '🚨' : 
                   status === 'POSSIBLE' ? '⚠️' : 
                   status === 'CLEAR' ? '✅' : 
                   status === 'ERROR' ? '❌' : '⏸️';
      
      console.log(`${emoji} Suspect #${suspect.id}: ${suspect.name}`);
      console.log(`   Status: ${status}`);
      
      if (suspect.result?.details) {
        console.log(`   Details:`, JSON.stringify(suspect.result.details, null, 2));
      }
      
      if (suspect.result?.error) {
        console.log(`   Error: ${suspect.result.error}`);
      }
      
      console.log('');
    });
    
    // Generate recommendations
    const suspectedIssues = suspects.filter(s => s.result?.status === 'SUSPECTED');
    
    if (suspectedIssues.length > 0) {
      console.log('🎯 RECOMMENDED FIXES:');
      console.log('====================\n');
      
      suspectedIssues.forEach(suspect => {
        console.log(`For Suspect #${suspect.id}:`);
        switch (suspect.id) {
          case 1:
            console.log('   - Implement unique key generation with timestamp + UUID');
            console.log('   - Check R2 bucket for duplicate keys');
            break;
          case 2:
            console.log('   - Fix backend response to return unique URLs per file');
            console.log('   - Check for shared variables in upload loop');
            break;
          case 3:
            console.log('   - Add cache busting parameters to URLs');
            console.log('   - Check CDN cache settings');
            break;
          case 7:
            console.log('   - Separate thumbnail and images array writes');
            console.log('   - Validate distinct fields in API request');
            break;
        }
        console.log('');
      });
    } else {
      console.log('✅ No obvious suspects found. Check manual tests or run with sample data.');
    }
  }
}

// Run the diagnosis
if (require.main === module) {
  const diagnostic = new ImageIssueDiagnostic();
  diagnostic.runDiagnosis().catch(console.error);
}

module.exports = ImageIssueDiagnostic;

