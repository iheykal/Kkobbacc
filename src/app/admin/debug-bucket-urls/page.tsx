'use client';

import { useState } from 'react';

export default function DebugBucketUrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const debugBucketUrls = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/debug-bucket-urls', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to debug bucket URLs');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Debug Bucket URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This diagnostic tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Show ALL properties in your database</li>
                  <li>Display their current image URLs</li>
                  <li>Identify which bucket names are being used</li>
                  <li>Help understand why the fix tool found 0 properties</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Debug Bucket URLs</h3>
              <button
                onClick={debugBucketUrls}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Debugging...' : 'Debug Bucket URLs'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Total Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.withImages || 0}</div>
                      <div className="text-gray-600">With Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.wrongBucket || 0}</div>
                      <div className="text-gray-600">Wrong Bucket</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.correctBucket || 0}</div>
                      <div className="text-gray-600">Correct Bucket</div>
                    </div>
                  </div>
                </div>

                {/* Bucket Analysis */}
                {results.bucketBreakdown && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🪣 Bucket Analysis</h3>
                    <div className="space-y-2">
                      {Object.entries(results.bucketBreakdown).map(([bucket, count]) => (
                        <div key={bucket} className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="font-mono text-sm">{bucket}</span>
                          <span className="text-lg font-bold text-blue-600">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Details */}
                {results.properties && results.properties.length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">📋 Property Details</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {results.properties.map((property: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded border">
                          <div className="font-medium text-lg mb-2">{property.title}</div>
                          <div className="text-sm text-gray-600 mb-2">ID: {property._id}</div>
                          
                          {/* Thumbnail */}
                          {property.thumbnailImage && (
                            <div className="mb-3">
                              <div className="font-medium text-sm mb-1">Thumbnail:</div>
                              <div className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                                {property.thumbnailImage}
                              </div>
                              {property.thumbnailImage.includes('kobac-property-uploads') && (
                                <div className="text-red-600 text-xs mt-1">❌ Wrong bucket name</div>
                              )}
                              {property.thumbnailImage.includes('kobac-real-estate') && (
                                <div className="text-green-600 text-xs mt-1">✅ Correct bucket name</div>
                              )}
                            </div>
                          )}

                          {/* Images */}
                          {property.images && property.images.length > 0 && (
                            <div>
                              <div className="font-medium text-sm mb-1">Images ({property.images.length}):</div>
                              <div className="space-y-1">
                                {property.images.map((imageUrl: string, imgIndex: number) => (
                                  <div key={imgIndex} className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                                    {imageUrl}
                                    {imageUrl.includes('kobac-property-uploads') && (
                                      <div className="text-red-600 text-xs mt-1">❌ Wrong bucket name</div>
                                    )}
                                    {imageUrl.includes('kobac-real-estate') && (
                                      <div className="text-green-600 text-xs mt-1">✅ Correct bucket name</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No Images */}
                          {!property.thumbnailImage && (!property.images || property.images.length === 0) && (
                            <div className="text-gray-500 text-sm">No images</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-blue-700 space-y-2">
                    {results.wrongBucket > 0 ? (
                      <div>
                        <p><strong>Found {results.wrongBucket} properties with wrong bucket names!</strong></p>
                        <p>Use the "Fix Bucket Name" tool to correct these URLs.</p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>All URLs are using the correct bucket name!</strong></p>
                        <p>If images are still not loading, the issue might be:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>R2 bucket permissions</li>
                          <li>Custom domain configuration</li>
                          <li>Environment variables</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
