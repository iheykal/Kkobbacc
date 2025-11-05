'use client';

import { useState } from 'react';

export default function TestR2AccessPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testR2Access = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-r2-access', {
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
        setError(data.error || 'Failed to test R2 access');
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
            🔍 Test R2 Access
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tests if R2 URLs are accessible from the browser</li>
                <li>• Checks CORS configuration</li>
                <li>• Verifies bucket permissions</li>
                <li>• Tests actual image loading</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Test R2 Access</h3>
              <button
                onClick={testR2Access}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test R2 Access'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalUrls || 0}</div>
                      <div className="text-gray-600">Total URLs Tested</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.accessibleUrls || 0}</div>
                      <div className="text-gray-600">Accessible</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.inaccessibleUrls || 0}</div>
                      <div className="text-gray-600">Inaccessible</div>
                    </div>
                  </div>
                </div>

                {/* URL Test Results */}
                {results.urlTests && results.urlTests.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🔗 URL Test Results</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.urlTests.map((test: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Property: {test.propertyTitle}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              test.accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {test.accessible ? '✅ Accessible' : '❌ Inaccessible'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 break-all mb-1">
                            <strong>URL:</strong> {test.url}
                          </div>
                          {test.error && (
                            <div className="text-xs text-red-600">
                              <strong>Error:</strong> {test.error}
                            </div>
                          )}
                          {test.status && (
                            <div className="text-xs text-gray-600">
                              <strong>Status:</strong> {test.status}
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
                      <div><span className="font-medium">Bucket:</span> {results.r2Config.bucket}</div>
                      <div><span className="font-medium">Public Base:</span> {results.r2Config.publicBase}</div>
                      <div><span className="font-medium">Public Base URL:</span> {results.r2Config.publicBaseUrl}</div>
                      <div><span className="font-medium">Endpoint:</span> {results.r2Config.endpoint}</div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {results.inaccessibleUrls > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-3">🔧 Recommendations</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Check R2 bucket CORS configuration</li>
                      <li>• Verify bucket is set to public</li>
                      <li>• Check if custom domain is properly configured</li>
                      <li>• Verify R2 credentials and permissions</li>
                      <li>• Test with a simple curl command</li>
                    </ul>
                  </div>
                )}

                {results.accessibleUrls > 0 && results.inaccessibleUrls === 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">✅ All URLs Accessible</h3>
                    <p className="text-sm text-green-700">
                      All R2 URLs are accessible. The image loading issues might be due to browser cache or network issues.
                    </p>
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
