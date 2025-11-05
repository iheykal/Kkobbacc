'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function DebugImagesPage() {
  const [propertyId, setPropertyId] = useState('')
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const testApi = async () => {
    setLoading(true)
    setError('')
    setDebugData(null)

    try {
      console.log('🔍 Testing simple API...')
      const response = await fetch('/api/test-debug?test=hello')
      
      console.log('🔍 Test response status:', response.status)
      console.log('🔍 Test response ok:', response.ok)
      
      const result = await response.json()
      console.log('🔍 Test response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Test API failed')
      }

      setDebugData({ testResult: result })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Test API error:', err)
      setError(`Test API Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const testPropertyApi = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID first')
      return
    }

    setLoading(true)
    setError('')
    setDebugData(null)

    try {
      console.log('🔍 Testing property API for ID:', propertyId)
      const response = await fetch(`/api/simple-property-test?propertyId=${propertyId}`)
      
      console.log('🔍 Property test response status:', response.status)
      console.log('🔍 Property test response ok:', response.ok)
      
      const result = await response.json()
      console.log('🔍 Property test response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Property test API failed')
      }

      setDebugData({ propertyTestResult: result })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Property test API error:', err)
      setError(`Property Test Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const testPropertyUpdate = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID first')
      return
    }

    setLoading(true)
    setError('')
    setDebugData(null)

    try {
      console.log('🔍 Testing property update simulation for ID:', propertyId)
      const response = await fetch('/api/property-upload-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: propertyId,
          testType: 'simulate_update'
        })
      })
      
      console.log('🔍 Property update test response status:', response.status)
      console.log('🔍 Property update test response ok:', response.ok)
      
      const result = await response.json()
      console.log('🔍 Property update test response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Property update test failed')
      }

      setDebugData({ propertyUpdateTest: result })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Property update test error:', err)
      setError(`Property Update Test Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const testRealUpload = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID first')
      return
    }

    setLoading(true)
    setError('')
    setDebugData(null)

    try {
      console.log('🔍 Testing real upload process for ID:', propertyId)
      
      // Create a test file
      const testFileContent = 'test-image-content-for-upload-test';
      const testFile = new File([testFileContent], 'test-image.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('files', testFile);
      formData.append('listingId', propertyId);
      
      const response = await fetch('/api/real-upload-test', {
        method: 'POST',
        body: formData
      })
      
      console.log('🔍 Real upload test response status:', response.status)
      console.log('🔍 Real upload test response ok:', response.ok)
      
      const result = await response.json()
      console.log('🔍 Real upload test response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Real upload test failed')
      }

      setDebugData({ realUploadTest: result })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Real upload test error:', err)
      setError(`Real Upload Test Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const debugPropertyImages = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID')
      return
    }

    setLoading(true)
    setError('')
    setDebugData(null)

    try {
      console.log('🔍 Debugging property images for ID:', propertyId)
      const response = await fetch(`/api/debug-property-images?propertyId=${propertyId}`)
      
      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)
      
      const result = await response.json()
      console.log('🔍 Response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to debug property images')
      }

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful result')
      }

      setDebugData(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Debug error:', err)
      setError(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Property Images</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={testApi}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test API'}
              </Button>
            </div>
            
            <div className="flex gap-4">
              <input
                type="text"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="Enter Property ID (e.g., 113)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={testPropertyApi}
                disabled={loading}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Property'}
              </Button>
              <Button
                onClick={testPropertyUpdate}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Update'}
              </Button>
              <Button
                onClick={testRealUpload}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Upload'}
              </Button>
              <Button
                onClick={debugPropertyImages}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Debugging...' : 'Debug Images'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}
        </div>

        {debugData && (
          <div className="space-y-6">
            {/* Test Results */}
            {debugData.testResult && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">API Test Results</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(debugData.testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Property Test Results */}
            {debugData.propertyTestResult && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Test Results</h2>
                
                {/* Quick Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Has Thumbnail</div>
                    <div className="text-lg font-bold text-blue-800">
                      {debugData.propertyTestResult.data?.hasThumbnailImage ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Has Images Array</div>
                    <div className="text-lg font-bold text-green-800">
                      {debugData.propertyTestResult.data?.hasImagesArray ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Images Count</div>
                    <div className="text-lg font-bold text-purple-800">
                      {debugData.propertyTestResult.data?.imagesArrayLength || 0}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Has Any Images</div>
                    <div className="text-lg font-bold text-orange-800">
                      {(debugData.propertyTestResult.data?.hasThumbnailImage || 
                        debugData.propertyTestResult.data?.hasImagesArray || 
                        debugData.propertyTestResult.data?.hasImageField) ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                </div>
                
                {/* Full Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(debugData.propertyTestResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Property Update Test Results */}
            {debugData.propertyUpdateTest && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Update Test Results</h2>
                
                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">Before Update</h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Thumbnail:</span> 
                        <span className="ml-2">{debugData.propertyUpdateTest.data?.originalProperty?.thumbnailImage || 'Empty'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Images:</span> 
                        <span className="ml-2">{debugData.propertyUpdateTest.data?.originalProperty?.images?.length || 0} items</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">After Update</h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Thumbnail:</span> 
                        <span className="ml-2">{debugData.propertyUpdateTest.data?.updatedProperty?.thumbnailImage || 'Empty'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Images:</span> 
                        <span className="ml-2">{debugData.propertyUpdateTest.data?.updatedProperty?.images?.length || 0} items</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Full Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(debugData.propertyUpdateTest, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Real Upload Test Results */}
            {debugData.realUploadTest && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Real Upload Test Results</h2>
                
                {/* Environment Check */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Environment Variables</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(debugData.realUploadTest.data?.envCheck || {}).map(([key, value]) => (
                      <div key={key} className={`p-3 rounded-lg ${value === 'SET' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="text-sm font-medium text-gray-700">{key}</div>
                        <div className={`text-sm font-bold ${value === 'SET' ? 'text-green-800' : 'text-red-800'}`}>
                          {value === 'SET' ? '✅ SET' : '❌ NOT SET'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Libraries Check */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Required Libraries</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${debugData.realUploadTest.data?.libraries?.sharp?.available ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="text-sm font-medium text-gray-700">Sharp (Image Processing)</div>
                      <div className={`text-sm font-bold ${debugData.realUploadTest.data?.libraries?.sharp?.available ? 'text-green-800' : 'text-red-800'}`}>
                        {debugData.realUploadTest.data?.libraries?.sharp?.available ? '✅ Available' : '❌ Not Available'}
                      </div>
                      {debugData.realUploadTest.data?.libraries?.sharp?.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {debugData.realUploadTest.data.libraries.sharp.error}
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-4 rounded-lg ${debugData.realUploadTest.data?.libraries?.awsSdk?.available ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="text-sm font-medium text-gray-700">AWS SDK (R2 Upload)</div>
                      <div className={`text-sm font-bold ${debugData.realUploadTest.data?.libraries?.awsSdk?.available ? 'text-green-800' : 'text-red-800'}`}>
                        {debugData.realUploadTest.data?.libraries?.awsSdk?.available ? '✅ Available' : '❌ Not Available'}
                      </div>
                      {debugData.realUploadTest.data?.libraries?.awsSdk?.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {debugData.realUploadTest.data.libraries.awsSdk.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${debugData.realUploadTest.data?.summary?.hasAllEnvVars ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="text-sm font-medium text-gray-700">Environment Variables</div>
                      <div className={`text-sm font-bold ${debugData.realUploadTest.data?.summary?.hasAllEnvVars ? 'text-green-800' : 'text-red-800'}`}>
                        {debugData.realUploadTest.data?.summary?.hasAllEnvVars ? '✅ All Set' : '❌ Missing'}
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${debugData.realUploadTest.data?.summary?.canProcessFiles ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="text-sm font-medium text-gray-700">File Processing</div>
                      <div className={`text-sm font-bold ${debugData.realUploadTest.data?.summary?.canProcessFiles ? 'text-green-800' : 'text-red-800'}`}>
                        {debugData.realUploadTest.data?.summary?.canProcessFiles ? '✅ Working' : '❌ Failed'}
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${debugData.realUploadTest.data?.summary?.hasRequiredLibraries ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="text-sm font-medium text-gray-700">Libraries</div>
                      <div className={`text-sm font-bold ${debugData.realUploadTest.data?.summary?.hasRequiredLibraries ? 'text-green-800' : 'text-red-800'}`}>
                        {debugData.realUploadTest.data?.summary?.hasRequiredLibraries ? '✅ Available' : '❌ Missing'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Full Data */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(debugData.realUploadTest, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {/* Summary - Only show if we have full debug data */}
            {debugData.summary && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Has Thumbnail</div>
                    <div className="text-lg font-bold text-blue-800">
                      {debugData.summary.hasThumbnailImage ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Has Images Array</div>
                    <div className="text-lg font-bold text-green-800">
                      {debugData.summary.hasImagesArray ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Resolved URLs</div>
                    <div className="text-lg font-bold text-purple-800">
                      {debugData.summary.totalResolvedUrls}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Has Any Images</div>
                    <div className="text-lg font-bold text-orange-800">
                      {debugData.summary.hasAnyImages ? '✅ Yes' : '❌ No'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Analysis - Only show if we have full debug data */}
            {debugData.imageAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Image Analysis</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Thumbnail Image</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.imageAnalysis.thumbnailImage, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Images Array</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.imageAnalysis.images, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Image Field</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.imageAnalysis.image, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Test - Only show if we have full debug data */}
            {debugData.resolutionTest && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">URL Resolution Test</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Resolved URLs</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.resolutionTest.resolvedUrls, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Primary URL</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(debugData.resolutionTest.primaryUrl, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Property Info - Only show if we have full debug data */}
            {debugData.imageAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Property Information</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify({
                      propertyId: debugData.imageAnalysis.propertyId,
                      _id: debugData.imageAnalysis._id,
                      title: debugData.imageAnalysis.title,
                      location: debugData.imageAnalysis.location,
                      district: debugData.imageAnalysis.district,
                      price: debugData.imageAnalysis.price,
                      status: debugData.imageAnalysis.status,
                      createdAt: debugData.imageAnalysis.createdAt,
                      updatedAt: debugData.imageAnalysis.updatedAt,
                      deletionStatus: debugData.imageAnalysis.deletionStatus,
                      expiresAt: debugData.imageAnalysis.expiresAt,
                      isExpired: debugData.imageAnalysis.isExpired
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
