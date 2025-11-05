'use client'

import { useState } from 'react'
import { uploadPropertyImagesToR2 } from '@/lib/r2-upload'

export default function TestUploadDebug() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    console.log('📁 Files selected:', selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select files first')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      console.log('🚀 Starting upload test with files:', files.map(f => f.name))
      
      const uploadResults = await uploadPropertyImagesToR2(files, 'test-property-id')
      
      console.log('✅ Upload completed:', uploadResults)
      setResults({
        success: true,
        uploadResults,
        imageUrls: uploadResults.map(result => result.url)
      })
    } catch (error) {
      console.error('❌ Upload failed:', error)
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Debug Test</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Files</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="mb-4"
          />
          
          {files.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Selected Files:</h3>
              <ul className="list-disc list-inside">
                {files.map((file, index) => (
                  <li key={index}>{file.name} ({file.size} bytes, {file.type})</li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={loading || files.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Test Upload'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

