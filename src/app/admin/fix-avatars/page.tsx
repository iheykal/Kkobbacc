'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

export default function FixAvatarsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixAvatars = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch('/api/admin/fix-avatar-urls', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to fix avatar URLs')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Fix Avatar URLs
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This tool will fix all avatar URLs in the database that are still using the old Unsplash URL 
              and replace them with the Kobac Real Estate logo.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              What this will do:
            </h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Find all users with old Unsplash avatar URLs</li>
              <li>• Find all properties with old Unsplash agent image URLs</li>
              <li>• Replace them with the Kobac Real Estate logo (/icons/uze.png)</li>
              <li>• Show you a summary of what was fixed</li>
            </ul>
          </div>

          <div className="text-center">
            <Button
              onClick={handleFixAvatars}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Fixing Avatar URLs...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Fix All Avatar URLs
                </>
              )}
            </Button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-green-50 border border-green-200 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">
                  Avatar URLs Fixed Successfully!
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Users Fixed</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-semibold text-green-600">{result.usersUpdated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining with old avatar:</span>
                      <span className="font-semibold text-orange-600">{result.remainingUsersWithOldAvatar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total users:</span>
                      <span className="font-semibold">{result.totalUsers}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Properties Fixed</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-semibold text-green-600">{result.propertiesUpdated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining with old avatar:</span>
                      <span className="font-semibold text-orange-600">{result.remainingPropertiesWithOldAvatar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total properties:</span>
                      <span className="font-semibold">{result.totalProperties}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>New default avatar:</strong> {result.newDefaultAvatar}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
