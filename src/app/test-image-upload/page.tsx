'use client';

import { useState } from 'react';

export default function ImageUploadTest() {
  const [results, setResults] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

  const showResult = (elementId: string, message: string, type: 'success' | 'error' | 'info') => {
    setResults(prev => ({
      ...prev,
      [elementId]: `${type.toUpperCase()}: ${message}`
    }));
  };

  const showLoading = (elementId: string, show: boolean) => {
    setLoading(prev => ({
      ...prev,
      [elementId]: show
    }));
  };

  const uploadImages = async () => {
    const files = (document.getElementById('imageFiles') as HTMLInputElement)?.files;
    const propertyId = (document.getElementById('propertyId') as HTMLInputElement)?.value;
    
    if (!files || files.length === 0) {
      showResult('uploadResult', 'Please select at least one image file.', 'error');
      return;
    }
    
    if (!propertyId) {
      showResult('uploadResult', 'Please enter a property ID.', 'error');
      return;
    }
    
    showLoading('uploadLoading', true);
    setResults(prev => ({ ...prev, uploadResult: '' }));
    
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      formData.append('listingId', propertyId);
      
      const response = await fetch(`${API_BASE}/api/properties/upload-images`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        showResult('uploadResult', 
          `Upload successful!\nFiles uploaded: ${result.files.length}\nPersisted to database: ${result.persisted}\nURLs:\n${result.files.map((f: any) => f.url).join('\n')}`, 
          'success'
        );
      } else {
        showResult('uploadResult', `Upload failed: ${result.error}`, 'error');
      }
      
    } catch (error: any) {
      showResult('uploadResult', `Error: ${error.message}`, 'error');
    } finally {
      showLoading('uploadLoading', false);
    }
  };

  const checkProperty = async () => {
    const propertyId = (document.getElementById('checkPropertyId') as HTMLInputElement)?.value;
    
    if (!propertyId) {
      showResult('checkResult', 'Please enter a property ID.', 'error');
      return;
    }
    
    showLoading('checkLoading', true);
    setResults(prev => ({ ...prev, checkResult: '' }));
    
    try {
      const response = await fetch(`${API_BASE}/api/properties/${propertyId}`);
      const result = await response.json();
      
      if (result.success) {
        const property = result.data;
        const hasImages = property.images && property.images.length > 0;
        const hasThumbnail = !!property.thumbnailImage;
        
        showResult('checkResult', 
          `Property found!\nProperty ID: ${property.propertyId}\nTitle: ${property.title}\nImages in database: ${property.images?.length || 0}\nHas thumbnail: ${hasThumbnail}\nThumbnail URL: ${property.thumbnailImage || 'None'}\nImages:\n${(property.images || []).map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}`, 
          hasImages ? 'success' : 'error'
        );
      } else {
        showResult('checkResult', `Property not found: ${result.error}`, 'error');
      }
      
    } catch (error: any) {
      showResult('checkResult', `Error: ${error.message}`, 'error');
    } finally {
      showLoading('checkLoading', false);
    }
  };

  const createDebugProperty = async () => {
    const propertyId = (document.getElementById('debugPropertyId') as HTMLInputElement)?.value;
    
    if (!propertyId) {
      showResult('debugPropertyResult', 'Please enter a debug property ID.', 'error');
      return;
    }
    
    showLoading('debugPropertyLoading', true);
    setResults(prev => ({ ...prev, debugPropertyResult: '' }));
    
    try {
      // First check if property exists
      const checkResponse = await fetch(`${API_BASE}/api/properties/${propertyId}`);
      const checkResult = await checkResponse.json();
      
      if (checkResult.success && checkResult.data) {
        showResult('debugPropertyResult', 
          `Property already exists!\nProperty ID: ${checkResult.data.propertyId}\nTitle: ${checkResult.data.title}\nImages: ${checkResult.data.images?.length || 0}\n\nYou can use this existing property for testing.`, 
          'info'
        );
        return;
      }
      
      // Create new debug property with all required fields and valid enum values
      const propertyData = {
        propertyId: parseInt(propertyId),
        title: "🧪 TEST PROPERTY - Image Upload Debug",
        description: "This is a test property created specifically for testing image uploads. You can safely delete this property after testing.",
        price: 100000,
        location: "Test Location",
        district: "Hamar‑Weyne", // Valid enum value
        beds: 3,
        baths: 2,
        sqft: 150,
        yearBuilt: 2020,
        lotSize: 200,
        propertyType: "villa", // Valid enum value
        status: "For Sale", // Valid enum value
        listingType: "sale", // Valid enum value
        features: ["Test Feature 1", "Test Feature 2"],
        amenities: ["Test Amenity 1", "Test Amenity 2"],
        agentId: "test-agent",
        agent: {
          name: "Test Agent",
          phone: "+1234567890",
          image: "/icons/kobac.png",
          rating: 5
        },
        featured: false,
        viewCount: 0,
        uniqueViewCount: 0,
        uniqueViewers: [],
        anonymousViewers: [],
        lastViewedAt: new Date(),
        deletionStatus: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isExpired: false,
        thumbnailImage: "",
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const response = await fetch(`${API_BASE}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showResult('debugPropertyResult', 
          `Debug property created successfully!\nProperty ID: ${result.data.propertyId}\nTitle: ${result.data.title}\nStatus: ${result.data.status}\n\nYou can now use this property for testing image uploads.`, 
          'success'
        );
        
        // Auto-fill the property ID fields
        (document.getElementById('propertyId') as HTMLInputElement).value = propertyId;
        (document.getElementById('checkPropertyId') as HTMLInputElement).value = propertyId;
        
      } else {
        showResult('debugPropertyResult', `Property creation failed: ${result.error}`, 'error');
      }
      
    } catch (error: any) {
      showResult('debugPropertyResult', `Error: ${error.message}`, 'error');
    } finally {
      showLoading('debugPropertyLoading', false);
    }
  };

  const testImageUrls = async () => {
    const propertyId = (document.getElementById('checkPropertyId') as HTMLInputElement)?.value || '999999';
    
    showLoading('urlTestLoading', true);
    setResults(prev => ({ ...prev, urlTestResult: '' }));
    
    try {
      const response = await fetch(`${API_BASE}/api/properties/${propertyId}/images`);
      const result = await response.json();
      
      if (result.success && result.data.images.length > 0) {
        const urlTests = [];
        
        for (const url of result.data.images) {
          try {
            const urlResponse = await fetch(url, { method: 'HEAD' });
            urlTests.push({
              url: url,
              accessible: urlResponse.ok,
              status: urlResponse.status
            });
          } catch (error: any) {
            urlTests.push({
              url: url,
              accessible: false,
              error: error.message
            });
          }
        }
        
        const accessibleCount = urlTests.filter(test => test.accessible).length;
        const totalCount = urlTests.length;
        
        const resultText = `URL Test Results:\nTotal URLs: ${totalCount}\nAccessible: ${accessibleCount}\nFailed: ${totalCount - accessibleCount}\n\nDetails:\n${urlTests.map(test => 
          `${test.accessible ? '✅' : '❌'} ${test.url} (${test.status || test.error})`
        ).join('\n')}`;
        
        showResult('urlTestResult', resultText, 
          accessibleCount === totalCount ? 'success' : 'error');
      } else {
        showResult('urlTestResult', 'No images found to test', 'error');
      }
      
    } catch (error: any) {
      showResult('urlTestResult', `Error: ${error.message}`, 'error');
    } finally {
      showLoading('urlTestLoading', false);
    }
  };

  const runCompleteTest = async () => {
    showLoading('completeTestLoading', true);
    setResults(prev => ({ ...prev, completeTestResult: '' }));
    
    let results = [];
    
    try {
      results.push('🧪 Running Complete Test...\n');
      
      const files = (document.getElementById('imageFiles') as HTMLInputElement)?.files;
      const propertyId = (document.getElementById('propertyId') as HTMLInputElement)?.value || '999999';
      
      if (files && files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append('files', file);
        }
        formData.append('listingId', propertyId);
        
        const uploadResponse = await fetch(`${API_BASE}/api/properties/upload-images`, {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        results.push(`📸 Upload: ${uploadResult.success ? '✅ PASS' : '❌ FAIL'}`);
        
        if (uploadResult.success) {
          // Test 2: Check Property
          const checkResponse = await fetch(`${API_BASE}/api/properties/${propertyId}`);
          const checkResult = await checkResponse.json();
          
          const hasImages = checkResult.data?.images?.length > 0;
          results.push(`🔍 Database: ${hasImages ? '✅ PASS' : '❌ FAIL'}`);
          
          // Test 3: URL Accessibility
          if (hasImages) {
            const urlResponse = await fetch(`${API_BASE}/api/properties/${propertyId}/images`);
            const urlResult = await urlResponse.json();
            
            if (urlResult.success && urlResult.data.images.length > 0) {
              let accessibleCount = 0;
              for (const url of urlResult.data.images) {
                try {
                  const testResponse = await fetch(url, { method: 'HEAD' });
                  if (testResponse.ok) accessibleCount++;
                } catch (e) {}
              }
              
              const allAccessible = accessibleCount === urlResult.data.images.length;
              results.push(`🔗 URLs: ${allAccessible ? '✅ PASS' : '❌ FAIL'} (${accessibleCount}/${urlResult.data.images.length})`);
            }
          }
        }
      } else {
        results.push('⚠️ No files selected for upload test');
      }
      
      const allPassed = results.every(r => r.includes('✅ PASS') || r.includes('⚠️'));
      showResult('completeTestResult', results.join('\n'), allPassed ? 'success' : 'error');
      
    } catch (error: any) {
      showResult('completeTestResult', `Test failed: ${error.message}`, 'error');
    } finally {
      showLoading('completeTestLoading', false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🚀 Image Upload Test</h1>
      <p className="text-gray-600 mb-8">This page tests the complete image upload flow including persistence to the database.</p>

      {/* Test 1: Upload Images */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">📸 Test 1: Upload Images</h3>
        <p className="text-gray-600 mb-4">Select multiple images and upload them to a property.</p>
        
        <input 
          type="file" 
          id="imageFiles" 
          multiple 
          accept="image/*"
          className="mb-4 p-2 border border-gray-300 rounded w-full"
        />
        <input 
          type="text" 
          id="propertyId" 
          placeholder="Property ID (e.g., 999999)" 
          defaultValue="999999"
          className="mb-4 p-2 border border-gray-300 rounded w-full"
        />
        <button 
          onClick={uploadImages}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Upload Images
        </button>
        
        {loading.uploadLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Uploading images...</p>
          </div>
        )}
        
        {results.uploadResult && (
          <div className={`mt-4 p-4 rounded ${results.uploadResult.startsWith('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <pre className="whitespace-pre-wrap">{results.uploadResult}</pre>
          </div>
        )}
      </div>

      {/* Test 2: Check Property */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">🔍 Test 2: Check Property</h3>
        <p className="text-gray-600 mb-4">Verify that the uploaded images are now in the property document.</p>
        
        <input 
          type="text" 
          id="checkPropertyId" 
          placeholder="Property ID to check" 
          defaultValue="999999"
          className="mb-4 p-2 border border-gray-300 rounded w-full"
        />
        <button 
          onClick={checkProperty}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Check Property
        </button>
        
        {loading.checkLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Checking property...</p>
          </div>
        )}
        
        {results.checkResult && (
          <div className={`mt-4 p-4 rounded ${results.checkResult.startsWith('SUCCESS') ? 'bg-green-100 text-green-800' : results.checkResult.startsWith('INFO') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
            <pre className="whitespace-pre-wrap">{results.checkResult}</pre>
          </div>
        )}
      </div>

      {/* Test 3: Create Debug Property */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">🧪 Test 3: Create Debug Property</h3>
        <p className="text-gray-600 mb-4">Create a test property specifically for testing image uploads.</p>
        
        <input 
          type="text" 
          id="debugPropertyId" 
          placeholder="Debug Property ID" 
          defaultValue="999999"
          className="mb-4 p-2 border border-gray-300 rounded w-full"
        />
        <button 
          onClick={createDebugProperty}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Debug Property
        </button>
        
        {loading.debugPropertyLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Creating debug property...</p>
          </div>
        )}
        
        {results.debugPropertyResult && (
          <div className={`mt-4 p-4 rounded ${results.debugPropertyResult.startsWith('SUCCESS') ? 'bg-green-100 text-green-800' : results.debugPropertyResult.startsWith('INFO') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
            <pre className="whitespace-pre-wrap">{results.debugPropertyResult}</pre>
          </div>
        )}
      </div>

      {/* Test 4: Test Image URLs */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">🔗 Test 4: Test Image URLs</h3>
        <p className="text-gray-600 mb-4">Test if the uploaded image URLs are accessible.</p>
        
        <button 
          onClick={testImageUrls}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Image URLs
        </button>
        
        {loading.urlTestLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Testing URLs...</p>
          </div>
        )}
        
        {results.urlTestResult && (
          <div className={`mt-4 p-4 rounded ${results.urlTestResult.startsWith('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <pre className="whitespace-pre-wrap">{results.urlTestResult}</pre>
          </div>
        )}
      </div>

      {/* Test 5: Complete Flow Test */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4">🎯 Test 5: Complete Flow Test</h3>
        <p className="text-gray-600 mb-4">Run all tests automatically.</p>
        
        <button 
          onClick={runCompleteTest}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Run Complete Test
        </button>
        
        {loading.completeTestLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Running complete test...</p>
          </div>
        )}
        
        {results.completeTestResult && (
          <div className={`mt-4 p-4 rounded ${results.completeTestResult.startsWith('SUCCESS') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <pre className="whitespace-pre-wrap">{results.completeTestResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
