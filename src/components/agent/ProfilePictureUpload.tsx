'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, CheckCircle, AlertCircle, User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

interface ProfilePictureUploadProps {
  onAvatarUpdate?: (newAvatar: string) => void
  className?: string
}

export default function ProfilePictureUpload({ onAvatarUpdate, className = '' }: ProfilePictureUploadProps) {
  const { user, updateUser } = useUser()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)

      console.log('🚀 Starting avatar upload process...')
      console.log('👤 User ID:', user?.id)
      console.log('📁 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('agentId', user?.id || '')

      console.log('📤 Sending upload request to /api/upload-avatar...')

      // Upload to R2
      const uploadResponse = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      })

      console.log('📥 Upload response status:', uploadResponse.status)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('❌ Upload failed with status:', uploadResponse.status)
        console.error('❌ Error response:', errorText)
        throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('📥 Upload result:', uploadResult)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      console.log('✅ Upload successful, updating avatar...')

      // Update avatar directly for all users (agents and superadmins)
      console.log('🔄 Updating avatar directly...')
      
      // Call the direct avatar update API
      const updateResponse = await fetch(`/api/users/${user?.id}/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          avatar: uploadResult.url
        })
      })

      console.log('📥 Update response status:', updateResponse.status)

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('❌ Avatar update failed with status:', updateResponse.status)
        console.error('❌ Error response:', errorText)
        throw new Error(`Avatar update failed (${updateResponse.status}): ${errorText}`)
      }

      const updateResult = await updateResponse.json()
      console.log('📥 Update result:', updateResult)

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update avatar')
      }

      console.log('🔄 Updating user context with new avatar:', uploadResult.url)
      
      // Update user context with new avatar
      if (updateUser) {
        updateUser({ ...user, avatar: uploadResult.url })
      }
      
      // Refresh user data from server to ensure consistency
      try {
        console.log('🔄 Refreshing user data from server...')
        const meResponse = await fetch('/api/auth/me', { cache: 'no-store' })
        if (meResponse.ok) {
          const meData = await meResponse.json()
          console.log('📥 Server user data:', meData)
          if (meData?.success && meData?.data) {
            const updatedUserData = {
              ...user,
              avatar: meData.data.avatar || uploadResult.url
            }
            console.log('🔄 Final user data update:', updatedUserData)
            updateUser(updatedUserData)
          }
        }
      } catch (error) {
        console.error('Error refreshing user data:', error)
      }
      
      setSuccess('Profile picture updated successfully!')
      setPreviewUrl(null)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('❌ Avatar upload error:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload avatar'
      
      if (error instanceof Error) {
        if (error.message.includes('Only superadmins can upload profile pictures')) {
          errorMessage = 'Upload service is temporarily unavailable. Please try again later.'
        } else if (error.message.includes('Only superadmins can update avatars directly')) {
          errorMessage = 'Avatar update service is temporarily unavailable. Please try again later.'
        } else if (error.message.includes('You can only update your own avatar')) {
          errorMessage = 'You can only update your own avatar.'
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Please log in again to upload your profile picture.'
        } else if (error.message.includes('File must be an image')) {
          errorMessage = 'Please select a valid image file (JPG, PNG, WebP).'
        } else if (error.message.includes('No file provided')) {
          errorMessage = 'Please select an image file to upload.'
        } else if (error.message.includes('Agent ID required')) {
          errorMessage = 'User ID is missing. Please refresh the page and try again.'
        } else if (error.message.includes('R2 configuration missing')) {
          errorMessage = 'Upload service is temporarily unavailable. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please select an image file')
      return
    }

    await uploadAvatar(file)
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await uploadAvatar(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 p-[3px] shadow-lg">
            <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName || 'Profile'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Silent error handling
                  }}
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-sm text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Upload Area - Show for all users */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          previewUrl 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
              />
              <button
                onClick={clearPreview}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Ready to upload</p>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center mx-auto transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Picture
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Change Profile Picture
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Upload a new profile picture. Supports JPG, PNG, and WebP formats.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center mx-auto transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Drag and drop an image here, or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
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
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
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
      </AnimatePresence>

      {/* Upload Guidelines - Show for all users */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Guidelines</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Maximum file size: 5MB</li>
          <li>• Supported formats: JPG, PNG, WebP</li>
          <li>• Recommended size: 400x400 pixels</li>
          <li>• Image will be automatically cropped to square</li>
        </ul>
      </div>
    </div>
  )
}
