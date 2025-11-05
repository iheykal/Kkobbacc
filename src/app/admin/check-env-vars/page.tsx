'use client';

import { useState } from 'react';

export default function CheckEnvVarsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkEnvVars = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/check-env-vars', {
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
        setError(data.error || 'Failed to check environment variables');
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
            🔍 Check Environment Variables
          </h1>
          
          <div className="space-y-6">
            {/* Description */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 What This Tool Does</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>This diagnostic tool will:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Check which environment variables are loaded</li>
                  <li>Show if MONGODB_URI is available</li>
                  <li>Display R2 configuration variables</li>
                  <li>Help identify missing or incorrect variables</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">⚡ Check Environment Variables</h3>
              <button
                onClick={checkEnvVars}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check Environment Variables'}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">📊 Environment Variables Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.mongodbUri ? '✅' : '❌'}</div>
                      <div className="text-gray-600">MONGODB_URI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.r2Bucket ? '✅' : '❌'}</div>
                      <div className="text-gray-600">R2_BUCKET</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.r2PublicBase ? '✅' : '❌'}</div>
                      <div className="text-gray-600">R2_PUBLIC_BASE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{results.totalVars || 0}</div>
                      <div className="text-gray-600">Total Variables</div>
                    </div>
                  </div>
                </div>

                {/* MongoDB Configuration */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">🗄️ MongoDB Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">MONGODB_URI:</span>
                      <span className="font-mono text-xs break-all">
                        {results.mongodbUri ? '✅ Set' : '❌ Missing'}
                      </span>
                    </div>
                    {results.mongodbUri && (
                      <div className="p-2 bg-white rounded border">
                        <div className="font-medium text-xs">Connection String (masked):</div>
                        <div className="font-mono text-xs break-all">
                          {results.mongodbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* R2 Configuration */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-3">☁️ R2 Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">R2_BUCKET:</span>
                      <span className="font-mono">{results.r2Bucket || '❌ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">R2_PUBLIC_BASE:</span>
                      <span className="font-mono text-xs break-all">{results.r2PublicBase || '❌ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">R2_PUBLIC_BASE_URL:</span>
                      <span className="font-mono text-xs break-all">{results.r2PublicBaseUrl || '❌ Missing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">R2_ENDPOINT:</span>
                      <span className="font-mono text-xs break-all">{results.r2Endpoint || '❌ Missing'}</span>
                    </div>
                  </div>
                </div>

                {/* All Environment Variables */}
                {results.allVars && Object.keys(results.allVars).length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">📋 All Environment Variables</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {Object.entries(results.allVars).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                          <span className="font-mono">{key}</span>
                          <span className="font-mono text-xs text-gray-600 break-all">
                            {typeof value === 'string' && value.length > 50 
                              ? value.substring(0, 50) + '...' 
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-3">💡 Recommendations</h3>
                  <div className="text-sm text-yellow-700 space-y-2">
                    {!results.mongodbUri ? (
                      <div>
                        <p><strong>MONGODB_URI is missing!</strong></p>
                        <p>Add this to your <code>.env</code> file:</p>
                        <div className="p-2 bg-white rounded border text-xs font-mono mt-2">
                          MONGODB_URI=mongodb://localhost:27017/kobac2025
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Environment variables look good!</strong></p>
                        <p>If database connection still fails, the issue might be:</p>
                        <ul className="ml-4 list-disc space-y-1">
                          <li>MongoDB service not running</li>
                          <li>Incorrect connection string format</li>
                          <li>Network connectivity issues</li>
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
