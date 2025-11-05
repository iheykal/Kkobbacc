'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function TestAvatarPage() {
  const { user, updateUser } = useUser()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setError(null)

    // Auto-upload the file
    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('agentId', user?.id || '')

      // Upload to R2
      const uploadResponse = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      // Update user avatar in database
      const updateResponse = await fetch(`/api/users/${user?.id}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatar: uploadResult.url
        })
      })

      const updateResult = await updateResponse.json()

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update avatar')
      }

      // Update local user context
      if (updateResult.data.avatar) {
        updateUser({ avatar: updateResult.data.avatar })
      }

      setSuccess('Avatar uploaded successfully!')
      setPreviewUrl(null)
      
      // Clear file input
      const fileInput = document.getElementById('avatar-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

    } catch (error) {
      console.error('Avatar upload error:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Avatar Upload Test</h1>
          <p className="text-gray-600">Test the avatar upload functionality</p>
        </motion.div>

        {/* Current User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.firstName || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{user?.phone}</p>
              <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
            </div>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Avatar</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {previewUrl && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
          >
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-green-700">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center"
          >
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-blue-700">Uploading avatar...</span>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <p>1. Select an image file (JPG, PNG, WebP)</p>
            <p>2. The file will be automatically uploaded and processed</p>
            <p>3. Your avatar will be updated in the database</p>
            <p>4. The new avatar will appear in the "Current User" section above</p>
            <p>5. Check that the avatar is also updated in the UserContext</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
