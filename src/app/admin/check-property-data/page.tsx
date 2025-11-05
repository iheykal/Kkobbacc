'use client';

import { useState } from 'react';

export default function CheckPropertyDataPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPropertyData = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/check-property-data', {
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
        setError(data.error || 'Failed to check property data');
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
            🔍 Check Property Data
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Show all properties in the database</li>
                  <li>Display their image data (thumbnailImage and images array)</li>
                  <li>Help identify why images aren't being saved</li>
                  <li>Show the complete property structure</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Check Property Data</h3>
              <button
                onClick={checkPropertyData}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Property Data'}
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
                      <div className="text-2xl font-bold text-green-600">{results.withThumbnail || 0}</div>
                      <div className="text-gray-600">With Thumbnail</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.withImages || 0}</div>
                      <div className="text-gray-600">With Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.recentProperties || 0}</div>
                      <div className="text-gray-600">Recent (24h)</div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                {results.properties && results.properties.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Property Details</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {results.properties.map((property: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded border">
                          <div className="font-medium text-lg mb-2">{property.title || 'Untitled'}</div>
                          <div className="text-sm text-gray-600 mb-2">ID: {property._id}</div>
                          <div className="text-sm text-gray-600 mb-2">Created: {new Date(property.createdAt).toLocaleString()}</div>
                          
                          {/* Property Status */}
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <div className="font-medium">Status:</div>
                              <div>{property.deletionStatus || 'active'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Type:</div>
                              <div>{property.propertyType || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Price:</div>
                              <div>{property.price || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Location:</div>
                              <div>{property.location || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Image Data */}
                          <div className="mt-3">
                            <div className="font-medium text-sm mb-1">Image Data:</div>
                            
                            {/* Thumbnail */}
                            <div className="mb-2">
                              <div className="text-xs font-medium">Thumbnail Image:</div>
                              {property.thumbnailImage ? (
                                <div className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                                  {property.thumbnailImage}
                                </div>
                              ) : (
                                <div className="text-xs text-red-600">❌ No thumbnail image</div>
                              )}
                            </div>
                            
                            {/* Images Array */}
                            <div>
                              <div className="text-xs font-medium">Images Array:</div>
                              {property.images && property.images.length > 0 ? (
                                <div className="space-y-1">
                                  {property.images.map((imageUrl: string, imgIndex: number) => (
                                    <div key={imgIndex} className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                                      {imageUrl}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-red-600">❌ No images array or empty</div>
                              )}
                            </div>
                          </div>

                          {/* Raw Data */}
                          <details className="mt-3">
                            <summary className="text-xs font-medium cursor-pointer">Raw Property Data</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(property, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Properties Found */}
                {results.totalProperties === 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-3">⚠️ No Properties Found</h3>
                    <div className="text-sm text-red-700 space-y-2">
                      <p><strong>The database contains 0 properties.</strong></p>
                      <p>This could mean:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>No properties have been uploaded yet</li>
                        <li>Properties are in a different collection</li>
                        <li>Database connection issues</li>
                        <li>Properties were deleted</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    {results.totalProperties === 0 ? (
                      <div>
                        <p><strong>No properties found in database.</strong></p>
                        <p>To test image functionality:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Upload a new property with images</li>
                          <li>Check if the upload process works</li>
                          <li>Verify images are saved to R2</li>
                          <li>Test image loading on the frontend</li>
                        </ul>
                      </div>
                    ) : results.withThumbnail === 0 && results.withImages === 0 ? (
                      <div>
                        <p><strong>Properties exist but have no image data!</strong></p>
                        <p>The issue is with the image upload process:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Images are uploaded to R2 but not saved to database</li>
                          <li>Check the property upload API endpoint</li>
                          <li>Verify image data is being saved correctly</li>
                          <li>Check for errors in the upload process</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Found properties with image data!</strong></p>
                        <p>Now you can:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Test the image URLs</li>
                          <li>Check if images load correctly</li>
                          <li>Fix any URL issues</li>
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
