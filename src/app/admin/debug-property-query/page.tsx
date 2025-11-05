'use client';

import { useState } from 'react';

export default function DebugPropertyQueryPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const debugQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/debug-property-query', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to debug property query');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Debug Property Query
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tests different database queries to find properties</li>
                <li>• Shows exactly what's in the database</li>
                <li>• Helps debug why the fix tools aren't finding properties</li>
                <li>• Provides detailed query results</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Debug Property Query</h3>
              <button
                onClick={debugQuery}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Debugging...' : 'Debug Property Query'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Query Results */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Query Results</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Total Properties:</span> {results.totalProperties}
                    </div>
                    <div>
                      <span className="font-medium">Properties with Thumbnail:</span> {results.withThumbnail}
                    </div>
                    <div>
                      <span className="font-medium">Properties with Images Array:</span> {results.withImagesArray}
                    </div>
                    <div>
                      <span className="font-medium">Properties with Either:</span> {results.withEither}
                    </div>
                    <div>
                      <span className="font-medium">Properties with Both:</span> {results.withBoth}
                    </div>
                  </div>
                </div>

                {/* Sample Properties */}
                {results.sampleProperties && results.sampleProperties.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Sample Properties</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {results.sampleProperties.map((property: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="font-medium">{property.title}</div>
                          <div className="text-gray-600">ID: {property._id}</div>
                          <div className="text-gray-600">Has Thumbnail: {property.thumbnailImage ? 'Yes' : 'No'}</div>
                          <div className="text-gray-600">Has Images Array: {property.images && property.images.length > 0 ? `Yes (${property.images.length})` : 'No'}</div>
                          
                          {property.thumbnailImage && (
                            <div className="mt-2">
                              <div className="font-medium">Thumbnail URL:</div>
                              <div className="text-xs text-gray-600 break-all">{property.thumbnailImage}</div>
                              <div className="text-xs text-blue-600">
                                Contains /uploads/listings/: {property.thumbnailImage.includes('/uploads/listings/') ? 'Yes' : 'No'}
                              </div>
                            </div>
                          )}
                          
                          {property.images && property.images.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">Images Array:</div>
                              {property.images.map((url: string, i: number) => (
                                <div key={i} className="text-xs text-gray-600 break-all">
                                  {url}
                                  <span className="text-blue-600 ml-2">
                                    (Contains /uploads/listings/: {url.includes('/uploads/listings/') ? 'Yes' : 'No'})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Fix Option */}
                {results.withEither > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">⚡ Manual Fix Option</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p>Since we found {results.withEither} properties with images, you can:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Use the manual fix tool below</li>
                        <li>Or try the simple fix tool again</li>
                      </ul>
                    </div>
                  </div>
                )}
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
