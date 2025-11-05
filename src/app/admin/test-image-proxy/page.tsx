'use client'

import { useState } from 'react'

interface TestResults {
  success: boolean
  originalUrl: string
  proxyUrl: string
  imageUrl: string
  size: number
  type: string
  direct?: boolean
}

export default function ImageProxyTestPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResults | null>(null)
  const [error, setError] = useState('')

  const testImageProxy = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const testImageUrl = 'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/68cfba8847f684e491fbaa25/d3347dc98f0d77fa-1758444174246-1758444174245-3t07rz0zwl.jpg';
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(testImageUrl)}`;

      console.log('🧪 Testing image proxy with URL:', testImageUrl);
      console.log('🔄 Proxy URL:', proxyUrl);

      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        setResults({
          success: true,
          originalUrl: testImageUrl,
          proxyUrl: proxyUrl,
          imageUrl: imageUrl,
          size: blob.size,
          type: blob.type
        });
        
        console.log('✅ Image proxy test successful!');
      } else {
        setError(`Proxy failed: ${response.status} ${response.statusText}`);
        console.error('❌ Proxy test failed:', response);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Proxy test failed: ' + errorMessage);
      console.error('❌ Proxy test error:', err);
    } finally {
      setLoading(false);
    }
  }

  const testDirectImage = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const testImageUrl = 'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/68cfba8847f684e491fbaa25/d3347dc98f0d77fa-1758444174246-1758444174245-3t07rz0zwl.jpg';

      console.log('🧪 Testing direct image access:', testImageUrl);

      const response = await fetch(testImageUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        setResults({
          success: true,
          originalUrl: testImageUrl,
          proxyUrl: 'Direct access',
          imageUrl: imageUrl,
          size: blob.size,
          type: blob.type,
          direct: true
        });
        
        console.log('✅ Direct image access successful!');
      } else {
        setError(`Direct access failed: ${response.status} ${response.statusText}`);
        console.error('❌ Direct access test failed:', response);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Direct access test failed: ' + errorMessage);
      console.error('❌ Direct access test error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Image Proxy Test
          </h1>
          <p className="text-gray-600">
            Test the image proxy to resolve CORS issues with R2 images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Controls</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ CORS Issue:</h4>
              <p className="text-sm text-yellow-700">
                R2 images are blocked by CORS policy. The image proxy should resolve this.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={testImageProxy}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing Proxy...' : 'Test Image Proxy'}
              </button>

              <button
                onClick={testDirectImage}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing Direct...' : 'Test Direct Access'}
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <strong>Test Image:</strong><br />
              <code className="text-xs break-all">
                https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/68cfba8847f684e491fbaa25/d3347dc98f0d77fa-1758444174246-1758444174245-3t07rz0zwl.jpg
              </code>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className={`border rounded-md p-4 ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`font-medium mb-2 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                    {results.success ? '✅' : '❌'} Test {results.direct ? 'Direct Access' : 'Image Proxy'} Successful!
                  </h3>
                  
                  <div className="text-sm text-gray-700 space-y-1">
                    <div><strong>Method:</strong> {results.direct ? 'Direct Access' : 'Image Proxy'}</div>
                    <div><strong>Size:</strong> {results.size} bytes</div>
                    <div><strong>Type:</strong> {results.type}</div>
                    <div><strong>Proxy URL:</strong> <code className="text-xs">{results.proxyUrl}</code></div>
                  </div>
                </div>

                {results.imageUrl && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Image Preview:</h4>
                    <img 
                      src={results.imageUrl} 
                      alt="Test image" 
                      className="max-w-full h-auto rounded-md"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {results.success && !results.direct && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Image proxy is working correctly</li>
                      <li>• Images should now load without CORS errors</li>
                      <li>• Check property pages to verify images display</li>
                      <li>• Consider configuring CORS on R2 bucket for better performance</li>
                    </ul>
                  </div>
                )}

                {results.success && results.direct && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="font-medium text-green-800 mb-2">Great News!</h4>
                    <p className="text-sm text-green-700">
                      Direct access is working! This means CORS might already be configured correctly, 
                      or the issue might be intermittent.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!results && !error && (
              <div className="text-center text-gray-500 py-8">
                <p>No test results yet. Use the controls to test image access.</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Test Image Proxy:</strong> Tests if the proxy can fetch and serve R2 images
            </div>
            <div>
              <strong>Test Direct Access:</strong> Tests if direct access to R2 images works
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <strong>Expected Results:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Image Proxy should work (avoids CORS)</li>
                <li>Direct Access might fail (CORS blocked)</li>
                <li>If both work, CORS might be configured correctly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}