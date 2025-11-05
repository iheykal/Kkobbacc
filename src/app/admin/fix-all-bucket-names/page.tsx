'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface FixResults {
  success: boolean
  message: string
  totalProperties?: number
  propertiesWithWrongBucket?: number
  fixed?: number
  errors?: number
  details?: any[]
}

export default function FixAllBucketNamesPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FixResults | null>(null)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState('')

  const fixAllBucketNames = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      console.log('🔧 Fixing all properties with wrong bucket names...');

      const response = await fetch('/api/admin/fix-all-bucket-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'fix_all'
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        console.log('✅ All bucket names fixed successfully!');
      } else {
        setError(`Fix failed: ${data.error || 'Unknown error'}`);
        console.error('❌ Fix failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fix bucket names: ' + errorMessage);
      console.error('❌ Fix error:', err);
    } finally {
      setLoading(false);
    }
  }

  const fixProperty126 = async () => {
    setLoading(true)
    setError('')

    try {
      // Parse image URLs from input
      const urls = imageUrls.split('\n').filter(url => url.trim() !== '');
      
      if (urls.length === 0) {
        setError('Please enter at least one image URL');
        setLoading(false);
        return;
      }

      console.log('🔧 Fixing property 126 with URLs:', urls);

      const response = await fetch('/api/admin/fix-all-bucket-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'fix_specific',
          propertyId: 126,
          imageUrls: urls
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        console.log('✅ Property 126 fixed successfully!');
      } else {
        setError(`Fix failed: ${data.error || 'Unknown error'}`);
        console.error('❌ Fix failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fix property 126: ' + errorMessage);
      console.error('❌ Fix error:', err);
    } finally {
      setLoading(false);
    }
  }

  const testWithSampleUrls = () => {
    const sampleUrls = [
      'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/126/sample-thumbnail.jpg',
      'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/126/sample-image1.jpg',
      'https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/126/sample-image2.jpg'
    ];
    setImageUrls(sampleUrls.join('\n'));
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Comprehensive Bucket Fix Tool
          </h1>
          <p className="text-gray-600">
            Fix all properties with wrong bucket names and missing images
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fix All Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Fix All Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Current Issues:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Properties using wrong bucket: 744f24f8a5918e0d996c5ff4009a7adb</li>
                  <li>• Should use correct bucket: 126b4cc26d8041e99d7cc45ade6cfd3b</li>
                  <li>• Images failing to load due to wrong URLs</li>
                </ul>
              </div>

              <Button
                onClick={fixAllBucketNames}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Fixing All Properties...' : 'Fix All Bucket Names'}
              </Button>

              <div className="text-sm text-gray-600">
                This will fix ALL properties that have wrong bucket names in their image URLs.
              </div>
            </CardContent>
          </Card>

          {/* Fix Property 126 */}
          <Card>
            <CardHeader>
              <CardTitle>Fix Property 126</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URLs (one per line)
                </label>
                <textarea
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                  placeholder="Enter image URLs, one per line:&#10;https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/126/image1.jpg&#10;https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/126/image2.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={fixProperty126}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Fixing...' : 'Fix Property 126'}
                </Button>

                <Button
                  onClick={testWithSampleUrls}
                  disabled={loading}
                  variant="secondary"
                >
                  Use Sample URLs
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                This will fix property 126 with specific image URLs.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`border rounded-md p-4 ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <h3 className={`font-medium mb-2 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                    {results.success ? '✅' : '❌'} {results.message}
                  </h3>
                  
                  {results.totalProperties !== undefined && (
                    <div className="text-sm text-gray-700">
                      <div><strong>Total Properties:</strong> {results.totalProperties}</div>
                      <div><strong>Properties with Wrong Bucket:</strong> {results.propertiesWithWrongBucket}</div>
                      <div><strong>Fixed:</strong> {results.fixed}</div>
                      <div><strong>Errors:</strong> {results.errors}</div>
                    </div>
                  )}
                </div>

                {results.details && results.details.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Fix Details:</h4>
                    <div className="max-h-96 overflow-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(results.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {results.success && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Check property pages to verify images are loading</li>
                      <li>• Test property 126: <a href="/kiro/126" target="_blank" className="underline">/kiro/126</a></li>
                      <li>• Check other properties that were fixed</li>
                      <li>• Verify no more "Property image failed to load" errors in console</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong>Step 1:</strong> Click "Fix All Bucket Names" to fix all properties with wrong bucket URLs
              </div>
              <div>
                <strong>Step 2:</strong> Enter real image URLs for property 126 and click "Fix Property 126"
              </div>
              <div>
                <strong>Step 3:</strong> Check the results and verify images are loading correctly
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <strong>Expected Result:</strong> All properties should use the correct bucket 
                (126b4cc26d8041e99d7cc45ade6cfd3b) and images should load without errors.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
