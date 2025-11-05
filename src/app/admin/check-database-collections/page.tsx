'use client';

import { useState } from 'react';

export default function CheckDatabaseCollectionsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDatabaseCollections = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/check-database-collections', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to check database collections');
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
            🗄️ Check Database Collections
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Check database connection details</li>
                  <li>List all collections in the database</li>
                  <li>Count documents in each collection</li>
                  <li>Help identify database/collection issues</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Check Database Collections</h3>
              <button
                onClick={checkDatabaseCollections}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Database Collections'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Database Info */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">🗄️ Database Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Database Name:</span>
                      <span className="font-mono">{results.databaseName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Connection String:</span>
                      <span className="font-mono text-xs break-all">
                        {results.connectionString || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Connection Status:</span>
                      <span className={results.connected ? 'text-green-600' : 'text-red-600'}>
                        {results.connected ? '✅ Connected' : '❌ Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collections */}
                {results.collections && results.collections.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Collections in Database</h3>
                    <div className="space-y-2">
                      {results.collections.map((collection: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                          <div>
                            <div className="font-medium">{collection.name}</div>
                            <div className="text-xs text-gray-600">Collection</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{collection.count}</div>
                            <div className="text-xs text-gray-600">Documents</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Properties Collection Details */}
                {results.propertiesCollection && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">🏠 Properties Collection Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Collection Name:</span>
                        <span className="font-mono">{results.propertiesCollection.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Document Count:</span>
                        <span className="font-mono">{results.propertiesCollection.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Sample Document:</span>
                        <span className="font-mono text-xs break-all">
                          {results.propertiesCollection.sampleId || 'No documents'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Collection Details */}
                {results.usersCollection && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">👥 Users Collection Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Collection Name:</span>
                        <span className="font-mono">{results.usersCollection.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Document Count:</span>
                        <span className="font-mono">{results.usersCollection.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Sample Document:</span>
                        <span className="font-mono text-xs break-all">
                          {results.usersCollection.sampleId || 'No documents'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-green-700 space-y-2">
                    {results.propertiesCollection && results.propertiesCollection.count > 0 ? (
                      <div>
                        <p><strong>Properties collection found with {results.propertiesCollection.count} documents!</strong></p>
                        <p>The issue might be with the property lookup query or ID format.</p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>No properties found in the database!</strong></p>
                        <p>This could mean:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>Properties are in a different database</li>
                          <li>Properties are in a different collection name</li>
                          <li>Properties were deleted or never created</li>
                          <li>Database connection is pointing to wrong database</li>
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
