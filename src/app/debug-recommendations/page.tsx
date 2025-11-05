'use client';

import { useState } from 'react';

export default function DebugRecommendationsPage() {
  const [district, setDistrict] = useState('');
  const [excludeId, setExcludeId] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    if (!district.trim()) {
      setError('Please enter a district');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        district: district.trim(),
        limit: '10'
      });

      if (excludeId.trim()) {
        params.append('excludeId', excludeId.trim());
      }

      const response = await fetch(`/api/debug-recommendations?${params}`);
      const result = await response.json();

      if (result.success) {
        setDebugData(result);
      } else {
        setError(result.error || 'Debug failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Debug Property Recommendations
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District:
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g., Hodan, Hamar Weyne"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclude Property ID (optional):
              </label>
              <input
                type="text"
                value={excludeId}
                onChange={(e) => setExcludeId(e.target.value)}
                placeholder="Property ID to exclude"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={runDebug}
            disabled={loading || !district.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔍 Debugging...' : '🔍 Run Debug Analysis'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">❌ Error:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {debugData && (
            <div className="mt-8 space-y-6">
              {/* Summary */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Properties:</span> {debugData.summary.totalProperties}
                  </div>
                  <div>
                    <span className="font-medium">With Images:</span> {debugData.summary.propertiesWithImages}
                  </div>
                  <div>
                    <span className="font-medium">Without Images:</span> {debugData.summary.propertiesWithoutImages}
                  </div>
                  <div>
                    <span className="font-medium">With Issues:</span> {debugData.summary.propertiesWithIssues}
                  </div>
                </div>
              </div>

              {/* Common Issues */}
              {Object.keys(debugData.summary.commonIssues).length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Common Issues</h3>
                  <div className="space-y-2">
                    {Object.entries(debugData.summary.commonIssues).map(([issue, count]) => (
                      <div key={issue} className="flex justify-between text-sm">
                        <span className="text-yellow-800">{issue}</span>
                        <span className="font-medium text-yellow-900">{count as number} properties</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">🏠 Property Details</h3>
                {debugData.debugData.map((property: any, index: number) => (
                  <div key={property._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{property.title}</h4>
                        <p className="text-sm text-gray-600">ID: {property._id} | District: {property.district}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        property.imageData.hasValidImage 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {property.imageData.hasValidImage ? '✅ Has Image' : '❌ No Image'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Image Data:</h5>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Thumbnail:</span> 
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              property.imageData.hasThumbnail ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {property.imageData.hasThumbnail ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Images Array:</span> 
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              property.imageData.hasImages ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {property.imageData.hasImages ? `Yes (${property.imageData.imageCount})` : 'No'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Primary URL:</span> 
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              property.imageData.hasValidImage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {property.imageData.hasValidImage ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">URLs:</h5>
                        <div className="space-y-1 text-xs">
                          {property.imageData.thumbnailImage && (
                            <div className="break-all bg-gray-100 p-2 rounded">
                              <span className="font-medium">Thumbnail:</span><br />
                              {property.imageData.thumbnailImage}
                            </div>
                          )}
                          {property.imageData.primaryImageUrl && (
                            <div className="break-all bg-gray-100 p-2 rounded">
                              <span className="font-medium">Primary:</span><br />
                              {property.imageData.primaryImageUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {property.issues.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <h5 className="font-medium text-red-900 mb-2">Issues Found:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                          {property.issues.map((issue: string, issueIndex: number) => (
                            <li key={issueIndex}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
