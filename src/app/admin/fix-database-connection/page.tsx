'use client';

import { useState } from 'react';

export default function FixDatabaseConnectionPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fixDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/fix-database-connection', {
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
        setError(data.error || 'Failed to fix database connection');
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
            🔧 Fix Database Connection
          </h1>
          
          <div className="space-y-6">
            {/* Problem Description */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-3">🚨 Problem Identified</h3>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Issue:</strong> Database connection failed</p>
                <p><strong>Result:</strong> No properties can be accessed, no images can be loaded</p>
                <p><strong>Impact:</strong> The entire property system is not working</p>
              </div>
            </div>

            {/* Common Causes */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">⚠️ Common Causes</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>Database connection issues are usually caused by:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li><strong>Missing MONGODB_URI</strong> in environment variables</li>
                  <li><strong>Incorrect connection string</strong> format</li>
                  <li><strong>Network connectivity</strong> issues</li>
                  <li><strong>MongoDB service</strong> not running</li>
                  <li><strong>Authentication</strong> problems</li>
                  <li><strong>Database name</strong> doesn't exist</li>
                </ul>
              </div>
            </div>

            {/* Environment Variables Check */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">🔧 Environment Variables</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p><strong>Check your .env.local file:</strong></p>
                <div className="p-3 bg-white rounded border text-xs font-mono">
                  <div>MONGODB_URI=mongodb://localhost:27017/kobac2025</div>
                  <div className="text-gray-500"># OR for MongoDB Atlas:</div>
                  <div>MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kobac2025</div>
                </div>
                <p className="text-xs text-gray-600">
                  Make sure the connection string is correct and the database exists.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Fix Database Connection</h3>
              <button
                onClick={fixDatabaseConnection}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Fixing...' : 'Fix Database Connection'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">🔌 Connection Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.connected ? '✅' : '❌'}</div>
                      <div className="text-gray-600">Database Connection</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.totalProperties || 0}</div>
                      <div className="text-gray-600">Properties Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.withImages || 0}</div>
                      <div className="text-gray-600">With Images</div>
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                {results.connectionDetails && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-3">📊 Connection Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Database Name:</span>
                        <span className="font-mono">{results.connectionDetails.databaseName || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Collection Name:</span>
                        <span className="font-mono">{results.connectionDetails.collectionName || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Connection String:</span>
                        <span className="font-mono text-xs break-all">{results.connectionDetails.connectionString || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Environment Variable:</span>
                        <span className="font-mono text-xs">{results.connectionDetails.hasEnvVar ? '✅ Set' : '❌ Missing'}</span>
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

                {/* Success Message */}
                {results.connected && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-3">✅ Database Connected!</h3>
                    <div className="text-sm text-green-700 space-y-2">
                      <p><strong>Great! The database connection is working.</strong></p>
                      <p>Found {results.totalProperties} properties in the database.</p>
                      {results.totalProperties > 0 ? (
                        <div>
                          <p>Now you can:</p>
                          <ul className="ml-4 list-disc space-y-1">
                            <li>Check property image URLs</li>
                            <li>Fix any bucket name issues</li>
                            <li>Test image loading</li>
                          </ul>
                        </div>
                      ) : (
                        <div>
                          <p>No properties found. You may need to:</p>
                          <ul className="ml-4 list-disc space-y-1">
                            <li>Upload some properties first</li>
                            <li>Check if properties are in a different collection</li>
                            <li>Verify the database name is correct</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Troubleshooting Steps */}
                {!results.connected && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-3">🔧 Troubleshooting Steps</h3>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>If the connection is still failing:</strong></p>
                      <ol className="ml-4 list-decimal space-y-1">
                        <li>Check your <code>.env.local</code> file has <code>MONGODB_URI</code></li>
                        <li>Verify the connection string format is correct</li>
                        <li>Make sure MongoDB is running (if using local MongoDB)</li>
                        <li>Check network connectivity to MongoDB Atlas (if using cloud)</li>
                        <li>Verify database credentials are correct</li>
                        <li>Restart your development server after changing environment variables</li>
                      </ol>
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
