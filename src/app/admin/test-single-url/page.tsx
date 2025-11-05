'use client';

import { useState } from 'react';

export default function TestSingleUrlPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to test');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-single-url', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to test URL');
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
            🔗 Test Single R2 URL
          </h1>
          
          <div className="space-y-6">
            {/* URL Input */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">📋 Enter R2 URL to Test</h3>
              <div className="space-y-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac252/uploads/listings/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={testUrl}
                  disabled={loading || !url.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Testing...' : 'Test URL'}
                </button>
              </div>
            </div>

            {/* Sample URLs */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">📋 Sample URLs to Test</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium mb-1">Thumbnail Image:</div>
                  <div className="text-xs text-gray-600 break-all">
                    https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac252/uploads/listings/68c0cb843dabd90fc28b9e12/1757465824729-thumbnail.jpg
                  </div>
                  <button
                    onClick={() => setUrl('https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac252/uploads/listings/68c0cb843dabd90fc28b9e12/1757465824729-thumbnail.jpg')}
                    className="mt-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  >
                    Use This URL
                  </button>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium mb-1">Another Thumbnail:</div>
                  <div className="text-xs text-gray-600 break-all">
                    https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac252/uploads/listings/68c0c0243dabd90fc28b9dac/1757465824487-thumbnail.jpg
                  </div>
                  <button
                    onClick={() => setUrl('https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/kobac252/uploads/listings/68c0c0243dabd90fc28b9dac/1757465824487-thumbnail.jpg')}
                    className="mt-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                  >
                    Use This URL
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">📊 Test Results</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      result.accessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.accessible ? '✅ Accessible' : '❌ Inaccessible'}
                    </span>
                  </div>
                  
                  {result.status && (
                    <div>
                      <span className="font-medium">HTTP Status:</span> {result.status} {result.statusText}
                    </div>
                  )}
                  
                  {result.error && (
                    <div>
                      <span className="font-medium">Error:</span> 
                      <span className="text-red-600 ml-1">{result.error}</span>
                    </div>
                  )}
                  
                  {result.headers && (
                    <div>
                      <span className="font-medium">Response Headers:</span>
                      <pre className="mt-1 p-2 bg-white rounded border text-xs overflow-auto">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.accessible && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="text-green-800 font-medium">✅ URL is accessible!</div>
                      <div className="text-green-700 text-sm mt-1">
                        The image should load correctly. If it's not showing in your app, the issue might be:
                      </div>
                      <ul className="text-green-700 text-sm mt-1 ml-4 list-disc">
                        <li>Browser cache</li>
                        <li>Component rendering issues</li>
                        <li>Network connectivity</li>
                      </ul>
                    </div>
                  )}
                  
                  {!result.accessible && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="text-red-800 font-medium">❌ URL is not accessible</div>
                      <div className="text-red-700 text-sm mt-1">
                        This indicates a problem with:
                      </div>
                      <ul className="text-red-700 text-sm mt-1 ml-4 list-disc">
                        <li>R2 bucket configuration</li>
                        <li>CORS settings</li>
                        <li>Bucket permissions</li>
                        <li>Custom domain setup</li>
                      </ul>
                    </div>
                  )}
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
