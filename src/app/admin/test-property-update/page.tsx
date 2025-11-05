'use client';

import { useState } from 'react';

export default function TestPropertyUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState('');

  const testPropertyUpdate = async () => {
    if (!propertyId.trim()) {
      setError('Please enter a property ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/test-property-update', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propertyId: propertyId.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to test property update');
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
            🧪 Test Property Update
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Test updating a property with sample image URLs</li>
                  <li>Simulate the image upload update process</li>
                  <li>Show if the property update API is working</li>
                  <li>Help debug why image URLs aren't being saved</li>
                </ul>
              </div>
            </div>

            {/* Property ID Input */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Test Property Update</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property ID to Test:
                  </label>
                  <input
                    type="text"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    placeholder="Enter property ID (e.g., 68c16a0542ee21d777f8e6c3)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={testPropertyUpdate}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Testing...' : 'Test Property Update'}
                </button>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Test Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.propertyFound ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Property Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.updateSuccess ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Update Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.verificationSuccess ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Verification</div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                {results.propertyData && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span className="font-mono">{results.propertyData._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Title:</span>
                        <span>{results.propertyData.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Thumbnail Image:</span>
                        <span className="font-mono text-xs break-all">
                          {results.propertyData.thumbnailImage || 'Empty'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Images Count:</span>
                        <span>{results.propertyData.images?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Update Details */}
                {results.updateDetails && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">🔄 Update Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Update Payload:</span>
                        <span className="font-mono text-xs break-all">
                          {JSON.stringify(results.updateDetails.payload)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Response Status:</span>
                        <span>{results.updateDetails.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Response OK:</span>
                        <span>{results.updateDetails.ok ? 'Yes' : 'No'}</span>
                      </div>
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
                    {results.updateSuccess ? (
                      <div>
                        <p><strong>Property update is working!</strong></p>
                        <p>The issue might be:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Image upload to R2 is failing</li>
                          <li>Image URLs are not being generated correctly</li>
                          <li>Frontend is not calling the update API</li>
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Property update is failing!</strong></p>
                        <p>Check the error details above and fix the update API.</p>
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
