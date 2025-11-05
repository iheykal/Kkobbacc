'use client';

import { useState } from 'react';

export default function TestR2UrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testR2Urls = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-r2-urls', {
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
        setError(data.error || 'Failed to test R2 URLs');
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
            🧪 Test R2 URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Get all property URLs from the database</li>
                  <li>Test each URL for accessibility</li>
                  <li>Show which URLs work and which don't</li>
                  <li>Help identify R2 configuration issues</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Test R2 URLs</h3>
              <button
                onClick={testR2Urls}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test R2 URLs'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalUrls || 0}</div>
                      <div className="text-gray-600">Total URLs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.accessible || 0}</div>
                      <div className="text-gray-600">Accessible</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.inaccessible || 0}</div>
                      <div className="text-gray-600">Inaccessible</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.properties || 0}</div>
                      <div className="text-gray-600">Properties</div>
                    </div>
                  </div>
                </div>

                {/* URL Test Results */}
                {results.urlTests && results.urlTests.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🔗 URL Test Results</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.urlTests.map((test: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{test.propertyTitle}</div>
                            <div className={`text-sm px-2 py-1 rounded ${
                              test.accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {test.accessible ? '✅ Accessible' : '❌ Inaccessible'}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 break-all bg-gray-100 p-2 rounded">
                            {test.url}
                          </div>
                          {test.error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {test.error}
                            </div>
                          )}
                          {test.status && (
                            <div className="text-xs text-gray-600 mt-1">
                              Status: {test.status}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* R2 Configuration */}
                {results.r2Config && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">⚙️ R2 Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Bucket:</span>
                        <span className="font-mono">{results.r2Config.bucket}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Public Base:</span>
                        <span className="font-mono text-xs break-all">{results.r2Config.publicBase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Endpoint:</span>
                        <span className="font-mono text-xs break-all">{results.r2Config.endpoint}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    {results.inaccessible > 0 ? (
                      <div>
                        <p><strong>Found {results.inaccessible} inaccessible URLs.</strong></p>
                        <p>This could be due to:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>R2 bucket not configured for public access</li>
                          <li>Custom domain not properly set up</li>
                          <li>Files don't exist in the bucket</li>
                          <li>CORS configuration issues</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p><strong>All URLs are accessible!</strong></p>
                        <p>If images are still not loading in the frontend, the issue might be with the image components or CORS settings.</p>
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
