'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface FixPropertyResults {
  success: boolean
  message: string
  data?: {
    propertyId: number
    title: string
    thumbnailImage: string
    images: string[]
  }
}

export default function FixProperty126Page() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<FixPropertyResults | null>(null)
  const [error, setError] = useState('')
  const [imageUrls, setImageUrls] = useState('')

  const fixProperty126 = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      // Parse image URLs from input
      const urls = imageUrls.split('\n').filter(url => url.trim() !== '');
      
      if (urls.length === 0) {
        setError('Please enter at least one image URL');
        setLoading(false);
        return;
      }

      const updatePayload = {
        thumbnailImage: urls[0] || '',
        images: urls.slice(1) || []
      };

      console.log('🔧 Fixing property 126 with URLs:', updatePayload);

      const response = await fetch('/api/properties/126', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults({
          success: true,
          message: 'Property 126 fixed successfully!',
          data: data.data
        });
        console.log('✅ Property 126 fixed successfully!');
      } else {
        setError(`Fix failed: ${data.error || 'Unknown error'}`);
        console.error('❌ Fix failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fix property: ' + errorMessage);
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

  const checkProperty126 = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/properties/126');
      const data = await response.json();

      if (data.success) {
        setResults({
          success: true,
          message: 'Property 126 current state:',
          data: data.data
        });
      } else {
        setError(`Failed to fetch property: ${data.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to check property: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Fix Property 126
          </h1>
          <p className="text-gray-600">
            Fix property 126 with real image URLs from R2 uploads
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fix Controls */}
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

              <Button
                onClick={checkProperty126}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Checking...' : 'Check Current State'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  <div className={`border rounded-md p-4 ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className={`font-medium mb-2 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                      {results.success ? '✅' : '❌'} {results.message}
                    </h3>
                    
                    {results.data && (
                      <div className="text-sm">
                        <div className="mb-2">
                          <strong>Property ID:</strong> {results.data.propertyId}
                        </div>
                        <div className="mb-2">
                          <strong>Title:</strong> {results.data.title}
                        </div>
                        <div className="mb-2">
                          <strong>Thumbnail:</strong> 
                          <div className="text-xs text-gray-600 mt-1 break-all">
                            "{results.data.thumbnailImage || 'Empty'}"
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>Images:</strong> {results.data.images?.length || 0} items
                          {results.data.images && results.data.images.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              {results.data.images.map((url, index) => (
                                <div key={index} className="break-all">
                                  {index + 1}. {url}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {results.success && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Next Steps:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Check the property page: <a href="/kiro/126" target="_blank" className="underline">/kiro/126</a></li>
                        <li>• Verify images are displaying correctly</li>
                        <li>• Test with other properties if needed</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!results && !error && (
                <div className="text-center text-gray-500 py-8">
                  <p>No results yet. Use the controls to fix property 126.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong>Step 1:</strong> Enter your real R2 image URLs (one per line)
              </div>
              <div>
                <strong>Step 2:</strong> Click "Fix Property 126" to update the property
              </div>
              <div>
                <strong>Step 3:</strong> Check the property page to verify images appear
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <strong>Note:</strong> The first URL will be used as the thumbnail image, 
                and the remaining URLs will be stored in the images array.
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <strong>Success:</strong> After fixing, property 126 should display images 
                instead of "No Images Available".
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
