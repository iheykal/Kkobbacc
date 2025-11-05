'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface CleanupStats {
  totalProperties: number
  propertiesWithUzeLogos: number
  propertiesWithoutUzeLogos: number
}

interface CleanupResult {
  thumbnailUpdated: number
  imagesUpdated: number
  iconsUpdated: number
}

export default function CleanUzeLogosPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<CleanupStats | null>(null)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [message, setMessage] = useState('')

  const checkForUzeLogos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clean-uze-logos')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setMessage(`Found ${data.stats.propertiesWithUzeLogos} properties with Uze logos`)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error checking for Uze logos: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const cleanUzeLogos = async () => {
    if (!confirm('Are you sure you want to remove all Uze logos from property images? This will replace them with placeholder images.')) {
      return
    }

    try {
      setLoading(true)
      setMessage('Cleaning Uze logos from properties...')
      
      const response = await fetch('/api/admin/clean-uze-logos', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        setCleanupResult(data.results)
        // Refresh stats
        await checkForUzeLogos()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error cleaning Uze logos: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-800 mb-2">
              🧹 Clean Uze Logos
            </h1>
            <p className="text-gray-600">
              Remove Uze logos from property images in the database
            </p>
          </div>

          {/* Info Section */}
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">🚨 Issue Description</h2>
              <div className="space-y-3 text-red-700">
                <p>• <strong>Problem:</strong> Some properties have Uze logos stored in their images arrays</p>
                <p>• <strong>Effect:</strong> Uze logos appear in property image galleries instead of just as watermarks</p>
                <p>• <strong>Solution:</strong> Clean the database by removing Uze logos from property images</p>
                <p>• <strong>Result:</strong> Properties will show only actual photos with watermark overlays</p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Database Status</h2>
              <button
                onClick={checkForUzeLogos}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Check for Uze Logos'}
              </button>
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalProperties}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.propertiesWithUzeLogos}</div>
                  <div className="text-sm text-gray-600">With Uze Logos</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.propertiesWithoutUzeLogos}</div>
                  <div className="text-sm text-gray-600">Clean</div>
                </div>
              </div>
            )}
          </div>

          {/* Cleanup Section */}
          {stats && stats.propertiesWithUzeLogos > 0 && (
            <div className="mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-yellow-800 mb-4">🧹 Cleanup Action</h2>
                <p className="text-yellow-700 mb-4">
                  Found {stats.propertiesWithUzeLogos} properties with Uze logos. Click the button below to clean them.
                </p>
                <button
                  onClick={cleanUzeLogos}
                  disabled={loading}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Cleaning...' : 'Clean Uze Logos'}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {cleanupResult && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Cleanup Results</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{cleanupResult.thumbnailUpdated}</div>
                    <div className="text-sm text-gray-600">Thumbnails Updated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{cleanupResult.imagesUpdated}</div>
                    <div className="text-sm text-gray-600">Images Arrays Updated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{cleanupResult.iconsUpdated}</div>
                    <div className="text-sm text-gray-600">Icons Removed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* Debug Links */}
          <div className="mt-8 text-center">
            <a 
              href="/debug-property-images"
              className="inline-block px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-4"
            >
              Debug Property Images
            </a>
            <a 
              href="/admin/apply-company-logo"
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Logo System
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
