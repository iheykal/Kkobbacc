'use client';

import { useState } from 'react';

export default function InspectPropertyUrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const inspectUrls = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/inspect-property-urls', {
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
        setError(data.error || 'Failed to inspect property URLs');
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
            🔍 Inspect Property URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Shows all property URLs stored in the database</li>
                <li>• Identifies bucket names and domains used</li>
                <li>• Helps understand the exact URL structure</li>
                <li>• Provides raw data for debugging</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Inspect Property URLs</h3>
              <button
                onClick={inspectUrls}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inspecting...' : 'Inspect Property URLs'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Total Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.propertiesWithImages || 0}</div>
                      <div className="text-gray-600">With Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.uniqueBuckets || 0}</div>
                      <div className="text-gray-600">Unique Buckets</div>
                    </div>
                  </div>
                </div>

                {/* Bucket Analysis */}
                {results.bucketAnalysis && Object.keys(results.bucketAnalysis).length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">🪣 Bucket Analysis</h3>
                    <div className="space-y-2">
                      {Object.entries(results.bucketAnalysis).map(([bucket, count]: [string, any]) => (
                        <div key={bucket} className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm font-mono">{bucket}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            bucket === 'kobac-property-uploads' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {count} URLs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domain Analysis */}
                {results.domainAnalysis && Object.keys(results.domainAnalysis).length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">🌐 Domain Analysis</h3>
                    <div className="space-y-2">
                      {Object.entries(results.domainAnalysis).map(([domain, count]: [string, any]) => (
                        <div key={domain} className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm font-mono break-all">{domain}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            domain.includes('pub-126b4cc26d8041e99d7cc45ade6cfd3b') 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {count} URLs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Property Data */}
                {results.properties && results.properties.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Raw Property Data</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {results.properties.map((property: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="font-medium mb-2">{property.title}</div>
                          <div className="text-gray-600 mb-2">ID: {property._id}</div>
                          
                          {property.thumbnailImage && (
                            <div className="mb-2">
                              <div className="font-medium">Thumbnail:</div>
                              <div className="text-xs text-gray-600 break-all">{property.thumbnailImage}</div>
                            </div>
                          )}
                          
                          {property.images && property.images.length > 0 && (
                            <div>
                              <div className="font-medium">Images ({property.images.length}):</div>
                              {property.images.map((url: string, i: number) => (
                                <div key={i} className="text-xs text-gray-600 break-all">{url}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">⚡ Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = '/admin/fix-bucket-mismatch'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                    >
                      Fix Bucket Mismatch
                    </button>
                    <button
                      onClick={() => window.location.href = '/admin/test-r2-access'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
                    >
                      Test R2 Access
                    </button>
                    <button
                      onClick={() => window.location.href = '/admin/diagnose-r2-urls'}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Diagnose R2 URLs
                    </button>
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
