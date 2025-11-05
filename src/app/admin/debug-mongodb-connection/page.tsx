'use client';

import { useState } from 'react';

export default function DebugMongoDBConnectionPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const debugMongoDB = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/debug-mongodb-connection', {
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
        setError(data.error || 'Failed to debug MongoDB connection');
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
            🔍 Debug MongoDB Connection
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This diagnostic tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Test MongoDB connection step by step</li>
                  <li>Show detailed error messages</li>
                  <li>Verify connection string format</li>
                  <li>Test database and collection access</li>
                  <li>Provide specific troubleshooting steps</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Debug MongoDB Connection</h3>
              <button
                onClick={debugMongoDB}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Debugging...' : 'Debug MongoDB Connection'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">🔌 Connection Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.envVar ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Environment Variable</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.connection ? '✅' : '❌'}</div>
                      <div className="text-gray-600">MongoDB Connection</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.database ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Database Access</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.collection ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Collection Access</div>
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">📊 Connection Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Environment Variable:</span>
                      <span className="font-mono text-xs">{results.envVar ? '✅ Set' : '❌ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Connection String:</span>
                      <span className="font-mono text-xs break-all">
                        {results.connectionString ? results.connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not available'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Database Name:</span>
                      <span className="font-mono">{results.databaseName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Collection Name:</span>
                      <span className="font-mono">{results.collectionName || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Error Details */}
                {results.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800 mb-3">❌ Error Details</h3>
                    <div className="text-sm text-red-700">
                      <div className="font-mono text-xs bg-white p-3 rounded border break-all">
                        {results.error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step-by-Step Results */}
                {results.steps && results.steps.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">📋 Step-by-Step Results</h3>
                    <div className="space-y-2">
                      {results.steps.map((step: any, index: number) => (
                        <div key={index} className="flex items-center p-2 bg-white rounded border">
                          <div className="text-lg mr-3">
                            {step.success ? '✅' : '❌'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{step.name}</div>
                            {step.message && (
                              <div className="text-xs text-gray-600">{step.message}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {results.connection && results.database && results.collection && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">✅ MongoDB Connection Working!</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p><strong>Great! MongoDB connection is working perfectly.</strong></p>
                      <p>Now you can:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        <li>Check what properties exist in the database</li>
                        <li>Fix any bucket name issues</li>
                        <li>Test image loading from R2</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Troubleshooting Steps */}
                {(!results.connection || !results.database || !results.collection) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🔧 Troubleshooting Steps</h3>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>Based on the results above:</strong></p>
                      <ul className="ml-4 list-disc space-y-1">
                        {!results.envVar && (
                          <li>Add MONGODB_URI to your .env file</li>
                        )}
                        {results.envVar && !results.connection && (
                          <li>Check your MongoDB Atlas connection string format</li>
                        )}
                        {results.connection && !results.database && (
                          <li>Verify the database name exists in MongoDB Atlas</li>
                        )}
                        {results.database && !results.collection && (
                          <li>Check if the properties collection exists</li>
                        )}
                        <li>Verify your MongoDB Atlas credentials are correct</li>
                        <li>Check if your IP address is whitelisted in MongoDB Atlas</li>
                        <li>Ensure your MongoDB Atlas cluster is running</li>
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
