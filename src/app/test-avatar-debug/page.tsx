'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, TestTube, AlertCircle, CheckCircle, User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function AvatarDebugPage() {
  const { user } = useUser()
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runConfigurationTest = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/test-avatar-upload')
      const result = await response.json()
      
      setTestResults(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const runUploadTest = async () => {
    if (!selectedFile) {
      setError('Please select a file first')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/test-avatar-upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      setTestResults(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avatar Upload Debug</h1>
              <p className="text-gray-600">Test and debug avatar upload functionality</p>
            </div>
          </div>

          {/* Current User Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current User</h2>
            {user ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Superadmin</label>
                  <p className="text-gray-900">
                    {(user.role === 'superadmin' || user.role === 'super_admin') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        No
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Not logged in</p>
            )}
          </div>

          {/* Test Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Configuration Test */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Configuration Test</h3>
              <p className="text-blue-700 text-sm mb-4">
                Test environment variables and authentication setup
              </p>
              <button
                onClick={runConfigurationTest}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Run Configuration Test
                  </>
                )}
              </button>
            </div>

            {/* Upload Test */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Upload Test</h3>
              <p className="text-green-700 text-sm mb-4">
                Test the actual file upload process
              </p>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <button
                  onClick={runUploadTest}
                  disabled={isLoading || !selectedFile}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Test Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Test Results */}
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="bg-white rounded-lg p-4 border">
                <pre className="text-sm text-gray-800 overflow-auto max-h-96">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}

          {/* Troubleshooting Tips */}
          <div className="mt-8 bg-yellow-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Troubleshooting Tips</h3>
            <div className="space-y-3 text-sm text-yellow-800">
              <div className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <p>Make sure you're logged in as a superadmin user</p>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <p>Check that all R2 environment variables are properly configured</p>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <p>Ensure the image file is less than 5MB and in a supported format (JPG, PNG, WebP)</p>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <p>Check the browser console for detailed error messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
