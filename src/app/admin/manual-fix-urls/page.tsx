'use client';

import { useState } from 'react';

export default function ManualFixUrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const manualFix = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/manual-fix-urls', {
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
        setError(data.error || 'Failed to manually fix URLs');
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
            🔧 Manual Fix URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Gets ALL properties from the database (no filtering)</li>
                <li>• Manually checks each property for image URLs</li>
                <li>• Fixes any URLs containing `/uploads/listings/`</li>
                <li>• Works regardless of query issues</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Manual Fix URLs</h3>
              <button
                onClick={manualFix}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing...' : 'Manual Fix URLs'}
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
                      <div className="text-gray-600">Total Properties</div>
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
                      <p><strong>URLs fixed!</strong> Now you should:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Go to the properties page and refresh</li>
                        <li>Check if images now load correctly</li>
                        <li>Test the fixed URLs using the single URL test tool</li>
                        <li>Verify all property images display properly</li>
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
