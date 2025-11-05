'use client';

import { useState } from 'react';

export default function FixBucketNamePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fixBucketName = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/fix-bucket-name', {
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
        setError(data.error || 'Failed to fix bucket name');
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
            🔧 Fix Bucket Name
          </h1>
          
          <div className="space-y-6">
            {/* Problem Description */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-3">🚨 Problem Identified</h3>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Issue:</strong> Wrong bucket name in URLs</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-red-800">Current URLs (Wrong):</div>
                    <div className="text-xs text-gray-600 break-all">
                      .../kobac-property-uploads/listings/...
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-green-800">Correct URLs:</div>
                    <div className="text-xs text-gray-600 break-all">
                      .../kobac-real-estate/listings/...
                    </div>
                  </div>
                </div>
                <p><strong>Result:</strong> URLs return 404 because bucket doesn't exist</p>
              </div>
            </div>

            {/* Solution */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">💡 Solution</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Find all URLs containing "kobac-property-uploads"</li>
                  <li>Replace with "kobac-real-estate"</li>
                  <li>Update both thumbnailImage and images array</li>
                  <li>Save the corrected URLs to the database</li>
                </ul>
              </div>
            </div>

            {/* Environment Variables Note */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">⚠️ Important Note</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>You also need to update your environment variables:</strong></p>
                <div className="p-2 bg-white rounded border text-xs">
                  <div>Update your <code>.env.local</code> file:</div>
                  <div className="mt-1">
                    <div>R2_BUCKET=kobac-real-estate</div>
                    <div>R2_PUBLIC_BASE=pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</div>
                    <div>R2_PUBLIC_BASE_URL=https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Fix Bucket Name</h3>
              <button
                onClick={fixBucketName}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing...' : 'Fix Bucket Name'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Fix Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Properties Checked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.fixed || 0}</div>
                      <div className="text-gray-600">URLs Fixed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.skipped || 0}</div>
                      <div className="text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.errors || 0}</div>
                      <div className="text-gray-600">Errors</div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {results.details && results.details.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Fix Details</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.details.map((detail: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="font-medium">{detail.propertyTitle}</div>
                          <div className="text-gray-600">Type: {detail.fixType}</div>
                          {detail.oldUrl && (
                            <div className="mt-1">
                              <div className="font-medium">Old URL:</div>
                              <div className="text-xs text-red-600 break-all">{detail.oldUrl}</div>
                            </div>
                          )}
                          {detail.newUrl && (
                            <div className="mt-1">
                              <div className="font-medium">New URL:</div>
                              <div className="text-xs text-green-600 break-all">{detail.newUrl}</div>
                            </div>
                          )}
                          {detail.error && (
                            <div className="mt-1 text-red-600">
                              <div className="font-medium">Error:</div>
                              <div className="text-xs">{detail.error}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {results.fixed > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">✅ Next Steps</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p><strong>Bucket name fixed!</strong> Now you need to:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Update your <code>.env.local</code> file with the correct bucket name</li>
                        <li>Restart your development server</li>
                        <li>Test the fixed URLs using the single URL test tool</li>
                        <li>Check if property images now load correctly</li>
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
