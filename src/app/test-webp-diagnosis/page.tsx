'use client';

import { useState } from 'react';

export default function TestWebPDiagnosis() {
  const [file, setFile] = useState<File | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDiagnostics(null);
      setError(null);
    }
  };

  const runDiagnosis = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/diagnose-webp', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setDiagnostics(result.diagnostics);
      } else {
        setError(result.error || 'Diagnosis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 WebP Conversion Diagnosis Tool
          </h1>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select an image file to diagnose:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Selected File:</h3>
              <p className="text-sm text-blue-700">
                <strong>Name:</strong> {file.name}<br />
                <strong>Type:</strong> {file.type}<br />
                <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={runDiagnosis}
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '🔍 Diagnosing...' : '🔍 Run Diagnosis'}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">❌ Error:</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {diagnostics && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">✅ Diagnosis Complete</h3>
                <p className="text-sm text-green-700">
                  Found {diagnostics.recommendations?.length || 0} potential issues
                </p>
              </div>

              {/* File Information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">📁 File Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {diagnostics.fileInfo?.name}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {diagnostics.fileInfo?.type}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {(diagnostics.fileInfo?.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div>
                    <span className="font-medium">Buffer Size:</span> {diagnostics.fileInfo?.bufferSize} bytes
                  </div>
                </div>
              </div>

              {/* Sharp Library Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">🔧 Sharp Library Status</h3>
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Available:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      diagnostics.sharpInfo?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {diagnostics.sharpInfo?.available ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Type:</span> {diagnostics.sharpInfo?.type}
                  </div>
                  {diagnostics.sharpInfo?.error && (
                    <div className="text-red-600">
                      <span className="font-medium">Error:</span> {diagnostics.sharpInfo.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Image Metadata */}
              {diagnostics.metadata && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">🖼️ Image Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Format:</span> {diagnostics.metadata.format}
                    </div>
                    <div>
                      <span className="font-medium">Dimensions:</span> {diagnostics.metadata.width} × {diagnostics.metadata.height}
                    </div>
                    <div>
                      <span className="font-medium">Channels:</span> {diagnostics.metadata.channels}
                    </div>
                    <div>
                      <span className="font-medium">Has Alpha:</span> {diagnostics.metadata.hasAlpha ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="font-medium">Animated:</span> {diagnostics.metadata.isAnimated ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="font-medium">Pages:</span> {diagnostics.metadata.pages || 1}
                    </div>
                  </div>
                </div>
              )}

              {/* WebP Test Results */}
              {diagnostics.webpTest && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">🧪 WebP Conversion Tests</h3>
                  
                  {/* Basic WebP Test */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Basic WebP Conversion</h4>
                    <div className={`p-3 rounded ${
                      diagnostics.webpTest.basic?.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {diagnostics.webpTest.basic?.success ? (
                        <div className="text-sm">
                          <div className="text-green-800">✅ Success</div>
                          <div>Size: {(diagnostics.webpTest.basic.size / 1024).toFixed(2)} KB</div>
                          <div>Compression: {diagnostics.webpTest.basic.compressionRatio}x</div>
                        </div>
                      ) : (
                        <div className="text-sm text-red-800">
                          ❌ Failed: {diagnostics.webpTest.basic?.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resized WebP Test */}
                  {diagnostics.webpTest.resized && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">WebP with Resizing</h4>
                      <div className={`p-3 rounded ${
                        diagnostics.webpTest.resized?.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {diagnostics.webpTest.resized?.success ? (
                          <div className="text-sm">
                            <div className="text-green-800">✅ Success</div>
                            <div>Size: {(diagnostics.webpTest.resized.size / 1024).toFixed(2)} KB</div>
                            <div>Compression: {diagnostics.webpTest.resized.compressionRatio}x</div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-800">
                            ❌ Failed: {diagnostics.webpTest.resized?.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Validation Test */}
                  {diagnostics.webpTest.validation && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">WebP Validation</h4>
                      <div className={`p-3 rounded ${
                        diagnostics.webpTest.validation?.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {diagnostics.webpTest.validation?.success ? (
                          <div className="text-sm">
                            <div className="text-green-800">✅ Valid WebP</div>
                            <div>Format: {diagnostics.webpTest.validation.format}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-800">
                            ❌ Invalid: {diagnostics.webpTest.validation?.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    {diagnostics.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
