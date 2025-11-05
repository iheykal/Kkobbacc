'use client';

import { useState } from 'react';

export default function CheckDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/check-database', {
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
        setError(data.error || 'Failed to check database');
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
            🗄️ Check Database
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This diagnostic tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Check database connection status</li>
                  <li>Count all properties in the database</li>
                  <li>Show sample property data</li>
                  <li>Identify any database connection issues</li>
                  <li>Help understand why no properties were found</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Check Database</h3>
              <button
                onClick={checkDatabase}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Database'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Database Status */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">🗄️ Database Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.connected ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Connection</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Total Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.sampleCount || 0}</div>
                      <div className="text-gray-600">Sample Properties</div>
                    </div>
                  </div>
                </div>

                {/* Database Info */}
                {results.databaseInfo && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">📊 Database Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Database Name:</span>
                        <span className="font-mono">{results.databaseInfo.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Collection Name:</span>
                        <span className="font-mono">{results.databaseInfo.collection || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Connection String:</span>
                        <span className="font-mono text-xs break-all">{results.databaseInfo.connectionString || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sample Properties */}
                {results.sampleProperties && results.sampleProperties.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Sample Properties</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {results.sampleProperties.map((property: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded border">
                          <div className="font-medium text-lg mb-2">{property.title || 'Untitled'}</div>
                          <div className="text-sm text-gray-600 mb-2">ID: {property._id}</div>
                          
                          {/* Property Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Price:</div>
                              <div>{property.price || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Location:</div>
                              <div>{property.location || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Type:</div>
                              <div>{property.propertyType || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="font-medium">Status:</div>
                              <div>{property.deletionStatus || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Images */}
                          <div className="mt-3">
                            <div className="font-medium text-sm mb-1">Images:</div>
                            {property.thumbnailImage ? (
                              <div className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                                Thumbnail: {property.thumbnailImage}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">No thumbnail</div>
                            )}
                            
                            {property.images && property.images.length > 0 ? (
                              <div className="mt-2">
                                <div className="text-xs text-gray-600">Images ({property.images.length}):</div>
                                {property.images.slice(0, 3).map((imageUrl: string, imgIndex: number) => (
                                  <div key={imgIndex} className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded mt-1">
                                    {imageUrl}
                                  </div>
                                ))}
                                {property.images.length > 3 && (
                                  <div className="text-xs text-gray-500 mt-1">... and {property.images.length - 3} more</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">No images array</div>
                            )}
                          </div>
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
                  <h3 className="font-medium text-green-800 mb-3">💡 Next Steps</h3>
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
                    ) : (
                      <div>
                        <p><strong>Found {results.totalProperties} properties!</strong></p>
                        <p>Now you can:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Check their image URLs</li>
                          <li>Fix any bucket name issues</li>
                          <li>Test image loading</li>
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
