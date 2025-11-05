'use client';

import { useState } from 'react';

export default function TestWebPConversion() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('listingId', 'test-webp-conversion');

      console.log('🧪 Testing WebP conversion with file:', file.name, file.type, file.size);

      const response = await fetch('/api/r2/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult({
          originalFile: {
            name: file.name,
            type: file.type,
            size: file.size
          },
          uploadedFiles: data.files,
          message: data.message
        });
        console.log('✅ WebP conversion test successful:', data);
      } else {
        setError(data.error || 'Upload failed');
        console.error('❌ WebP conversion test failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ WebP conversion test error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 WebP Conversion Test
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This test uploads an image to verify that WebP conversion is working properly.
              The image will be automatically converted to WebP format before saving to Cloudflare R2.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? '🔄 Uploading...' : '📸 Choose Image to Test WebP Conversion'}
              </label>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">❌ Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-green-800 font-medium">✅ Upload Successful</h3>
                <p className="text-green-700 mt-1">{result.message}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-3">📁 Original File</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {result.originalFile.name}</p>
                    <p><span className="font-medium">Type:</span> {result.originalFile.type}</p>
                    <p><span className="font-medium">Size:</span> {(result.originalFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-3">🖼️ Processed Files</h3>
                  {result.uploadedFiles.map((file: any, index: number) => (
                    <div key={index} className="space-y-2 text-sm">
                      <p><span className="font-medium">Key:</span> {file.key}</p>
                      <p><span className="font-medium">URL:</span> 
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          View Image
                        </a>
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.key.includes('.webp') ? '✅ Converted to WebP' : '⚠️ Original format'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {result.uploadedFiles.some((file: any) => file.key.includes('.webp')) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="text-yellow-800 font-medium">🎉 WebP Conversion Working!</h3>
                  <p className="text-yellow-700 mt-1">
                    Your images are now being automatically converted to WebP format for better performance and smaller file sizes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
