'use client';

import { useState } from 'react';

export default function TestR2BucketAccessPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testR2BucketAccess = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-r2-bucket-access', {
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
        setError(data.error || 'Failed to test R2 bucket access');
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
            🧪 Test R2 Bucket Access
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Test R2 bucket connectivity</li>
                  <li>Check if bucket exists and is accessible</li>
                  <li>Test uploading a sample file</li>
                  <li>Test accessing the uploaded file</li>
                  <li>Help identify R2 configuration issues</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Test R2 Bucket Access</h3>
              <button
                onClick={testR2BucketAccess}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test R2 Bucket Access'}
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
                      <div className="text-2xl font-bold text-blue-600">{results.bucketExists ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Bucket Exists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.uploadSuccess ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Upload Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.accessSuccess ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Access Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.publicAccess ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Public Access</div>
                    </div>
                  </div>
                </div>

                {/* R2 Configuration */}
                {results.config && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">⚙️ R2 Configuration</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Bucket:</span>
                        <span className="font-mono">{results.config.bucket}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Endpoint:</span>
                        <span className="font-mono text-xs break-all">{results.config.endpoint}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Public Base:</span>
                        <span className="font-mono text-xs break-all">{results.config.publicBase}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Details */}
                {results.tests && results.tests.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🧪 Test Details</h3>
                    <div className="space-y-2">
                      {results.tests.map((test: any, index: number) => (
                        <div key={index} className="flex items-center p-2 bg-white rounded border">
                          <div className="text-lg mr-3">
                            {test.success ? '✅' : '❌'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{test.name}</div>
                            {test.message && (
                              <div className="text-xs text-gray-600">{test.message}</div>
                            )}
                            {test.url && (
                              <div className="text-xs text-blue-600 break-all">{test.url}</div>
                            )}
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
                    {results.publicAccess ? (
                      <div>
                        <p><strong>R2 bucket is configured correctly!</strong></p>
                        <p>If images are still not loading, the issue might be with the image URLs or file paths.</p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>R2 bucket needs to be configured for public access!</strong></p>
                        <p>To fix this:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Go to your Cloudflare R2 dashboard</li>
                          <li>Find your <code>kobac-real-estate</code> bucket</li>
                          <li>Enable "Public Access" in bucket settings</li>
                          <li>Or configure a custom domain for public access</li>
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
