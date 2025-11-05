'use client';

import { useState } from 'react';

export default function TestR2BucketPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testBucket = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-r2-bucket', {
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
        setError(data.error || 'Failed to test R2 bucket');
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
            🪣 Test R2 Bucket Configuration
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tests R2 bucket connectivity and permissions</li>
                <li>• Checks if the bucket exists and is accessible</li>
                <li>• Verifies custom domain configuration</li>
                <li>• Tests uploading a test file</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Test R2 Bucket</h3>
              <button
                onClick={testBucket}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test R2 Bucket'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Configuration */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">⚙️ R2 Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Bucket:</span> {results.bucket}</div>
                    <div><span className="font-medium">Endpoint:</span> {results.endpoint}</div>
                    <div><span className="font-medium">Public Base:</span> {results.publicBase}</div>
                    <div><span className="font-medium">Public Base URL:</span> {results.publicBaseUrl}</div>
                  </div>
                </div>

                {/* Test Results */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">🧪 Test Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Bucket Access:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        results.bucketAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {results.bucketAccess ? '✅ Accessible' : '❌ Not Accessible'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Custom Domain:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        results.customDomainWorking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {results.customDomainWorking ? '✅ Working' : '❌ Not Working'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Upload Test:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        results.uploadTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {results.uploadTest ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {results.errors && results.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-3">❌ Error Details</h3>
                    <div className="space-y-2">
                      {results.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-700">{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {!results.bucketAccess && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🔧 Recommendations</h3>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>Bucket Access Issues:</strong></p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Check if the bucket exists in your Cloudflare R2 dashboard</li>
                        <li>Verify the bucket name is correct: <code>kobac-property-uploads</code></li>
                        <li>Check your R2 credentials and permissions</li>
                        <li>Ensure the bucket is in the correct region</li>
                      </ul>
                    </div>
                  </div>
                )}

                {!results.customDomainWorking && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🌐 Custom Domain Issues</h3>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>Custom Domain Issues:</strong></p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Check if the custom domain is properly configured in R2</li>
                        <li>Verify the domain: <code>pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</code></li>
                        <li>Ensure the bucket is set to public access</li>
                        <li>Check if there are any DNS or SSL issues</li>
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
