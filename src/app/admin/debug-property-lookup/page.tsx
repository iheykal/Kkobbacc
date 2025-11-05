'use client';

import { useState } from 'react';

export default function DebugPropertyLookupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState('');

  const debugPropertyLookup = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/debug-property-lookup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propertyId: propertyId.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to debug property lookup');
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
            🔍 Debug Property Lookup
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Try different ways to find a property by ID</li>
                  <li>Show all properties in the database</li>
                  <li>Help debug property lookup issues</li>
                  <li>Show the exact property data structure</li>
                </ul>
              </div>
            </div>

            {/* Property ID Input */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Debug Property Lookup</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property ID to Lookup:
                  </label>
                  <input
                    type="text"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    placeholder="Enter property ID (e.g., 68c16a0542ee21d777f8e6c3 or 59)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={debugPropertyLookup}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Debugging...' : 'Debug Property Lookup'}
                </button>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Lookup Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Total Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.foundByMongoId ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Found by Mongo ID</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.foundByPropertyId ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Found by Property ID</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.foundByString ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Found by String</div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                {results.propertyData && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Found Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Mongo ID:</span>
                        <span className="font-mono">{results.propertyData._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Property ID:</span>
                        <span className="font-mono">{results.propertyData.propertyId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Title:</span>
                        <span>{results.propertyData.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Thumbnail Image:</span>
                        <span className="font-mono text-xs break-all">
                          {results.propertyData.thumbnailImage || 'Empty'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Images Count:</span>
                        <span>{results.propertyData.images?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* All Properties */}
                {results.allProperties && results.allProperties.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">📋 All Properties in Database</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.allProperties.map((property: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="font-medium">{property.title || 'Untitled'}</div>
                          <div className="text-sm text-gray-600">
                            Mongo ID: <span className="font-mono">{property._id}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Property ID: <span className="font-mono">{property.propertyId}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Thumbnail: {property.thumbnailImage ? '✅' : '❌'}
                          </div>
                          <div className="text-sm text-gray-600">
                            Images: {property.images?.length || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {results.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-3">❌ Error Details</h3>
                    <div className="text-sm text-red-700">
                      <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                        {results.error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    {results.foundByMongoId || results.foundByPropertyId ? (
                      <div>
                        <p><strong>Property found!</strong></p>
                        <p>Use the correct ID format for updates:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Mongo ID: {results.propertyData?._id}</li>
                          <li>Property ID: {results.propertyData?.propertyId}</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Property not found!</strong></p>
                        <p>Check the property ID format and try again.</p>
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
