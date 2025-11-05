'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function FixR2UrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fixR2Urls = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/fix-r2-urls', {
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
        setError(data.error || 'Failed to fix R2 URLs');
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
            🔧 Fix R2 URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Finds properties with incorrect R2 domain URLs</li>
                <li>• Updates URLs from wrong domains to correct domain</li>
                <li>• Fixes both thumbnailImage and images array URLs</li>
                <li>• Ensures all property images load correctly</li>
              </ul>
            </div>

            {/* Current R2 Config */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">🔍 Current R2 Configuration</h3>
              <div className="text-sm text-yellow-700">
                <p><strong>Correct Domain:</strong> pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev</p>
                <p><strong>Wrong Domains Found:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev</li>
                  <li>• pub-36a660b428c343399354263f0c318585.r2.dev</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Fix R2 URLs</h3>
              <button
                onClick={fixR2Urls}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing URLs...' : 'Fix R2 URLs'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">📊 Results</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Total Properties Checked:</span> {results.total}</div>
                  <div><span className="font-medium">Properties Fixed:</span> {results.fixed}</div>
                  <div><span className="font-medium">Properties Skipped:</span> {results.skipped}</div>
                  <div><span className="font-medium">Errors:</span> {results.errors}</div>
                </div>
                
                {results.details && results.details.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      Show Details ({results.details.length} items)
                    </summary>
                    <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                      {results.details.map((detail: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-xs">
                          <div><strong>Property:</strong> {detail.title}</div>
                          <div><strong>Type:</strong> {detail.fixType}</div>
                          {detail.oldUrl && (
                            <div><strong>Old URL:</strong> <span className="text-red-600 break-all">{detail.oldUrl}</span></div>
                          )}
                          {detail.newUrl && (
                            <div><strong>New URL:</strong> <span className="text-green-600 break-all">{detail.newUrl}</span></div>
                          )}
                          {detail.error && (
                            <div><strong>Error:</strong> <span className="text-red-600">{detail.error}</span></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
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

            {/* Next Steps */}
            {results && results.fixed > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-3">✅ Next Steps</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Go to the properties page to verify images load correctly</li>
                  <li>• Check the agent dashboard to ensure new uploads use correct URLs</li>
                  <li>• Test property detail pages to confirm image display</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
