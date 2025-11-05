'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function DiagnoseR2UrlsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const diagnoseR2Urls = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/diagnose-r2-urls', {
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
        setError(data.error || 'Failed to diagnose R2 URLs');
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
            🔍 Diagnose R2 URLs
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Scans all properties for R2 URLs</li>
                <li>• Identifies which domains are being used</li>
                <li>• Shows detailed breakdown of URL patterns</li>
                <li>• Helps identify what needs to be fixed</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Diagnose R2 URLs</h3>
              <button
                onClick={diagnoseR2Urls}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Diagnosing...' : 'Diagnose R2 URLs'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Total Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.propertiesWithImages || 0}</div>
                      <div className="text-gray-600">With Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.propertiesWithWrongUrls || 0}</div>
                      <div className="text-gray-600">Wrong URLs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{results.propertiesWithCorrectUrls || 0}</div>
                      <div className="text-gray-600">Correct URLs</div>
                    </div>
                  </div>
                </div>

                {/* Domain Breakdown */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">🌐 Domain Breakdown</h3>
                  <div className="space-y-2">
                    {results.domainBreakdown && Object.entries(results.domainBreakdown).map(([domain, count]: [string, any]) => (
                      <div key={domain} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-sm font-mono break-all">{domain}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          domain.includes('pub-126b4cc26d8041e99d7cc45ade6cfd3b') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {count} properties
                        </span>
                      </div>
                    ))}
                    {(!results.domainBreakdown || Object.keys(results.domainBreakdown).length === 0) && (
                      <div className="p-2 bg-white rounded border text-sm text-gray-500">
                        No domain data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample Properties */}
                {results.sampleProperties && results.sampleProperties.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Sample Properties with Wrong URLs</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.sampleProperties.map((property: any, index: number) => (
                        <div key={index} className="p-3 bg-white rounded border text-sm">
                          <div className="font-medium">{property.title}</div>
                          <div className="text-gray-600">ID: {property._id}</div>
                          {property.thumbnailImage && (
                            <div className="mt-1">
                              <span className="font-medium">Thumbnail:</span>
                              <div className="text-xs text-red-600 break-all">{property.thumbnailImage}</div>
                            </div>
                          )}
                          {property.images && property.images.length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">Images ({property.images.length}):</span>
                              {property.images.slice(0, 2).map((url: string, i: number) => (
                                <div key={i} className="text-xs text-red-600 break-all">{url}</div>
                              ))}
                              {property.images.length > 2 && (
                                <div className="text-xs text-gray-500">... and {property.images.length - 2} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {results.propertiesWithWrongUrls > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">⚡ Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => window.location.href = '/admin/fix-r2-urls'}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mr-2"
                      >
                        Fix R2 URLs ({results.propertiesWithWrongUrls} properties)
                      </button>
                      <button
                        onClick={() => window.location.href = '/debug-r2-env'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Check R2 Environment
                      </button>
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
