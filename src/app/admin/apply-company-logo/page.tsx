'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface LogoStats {
  totalProperties: number
  propertiesWithLogo: number
  propertiesWithoutLogo: number
}

interface UpdateResult {
  propertyId: number
  title: string
  oldImageCount?: number
  newImageCount?: number
  error?: string
}

export default function ApplyCompanyLogoPage() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<LogoStats | null>(null)
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([])
  const [message, setMessage] = useState('')

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/apply-company-logo')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setMessage(data.message)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error fetching stats: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const applyLogoToAllProperties = async () => {
    if (!confirm('Are you sure you want to apply the company logo to all existing properties? This will add the logo to properties that don\'t already have it.')) {
      return
    }

    try {
      setLoading(true)
      setMessage('Applying company logo to existing properties...')
      
      const response = await fetch('/api/admin/apply-company-logo', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        setUpdateResults(data.results || [])
        // Refresh stats
        await fetchStats()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error applying logo: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
                         <h1 className="text-3xl font-bold text-gray-800 mb-2">
               Uze Logo Watermark System
             </h1>
             <p className="text-gray-600">
               The Uze company logo is now applied as a transparent watermark overlay on all property images
             </p>
          </div>

          {/* Info Section */}
          <div className="mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Watermark System Active</h2>
                             <div className="space-y-3 text-green-700">
                 <p>• <strong>Automatic Watermark:</strong> The Uze logo is automatically applied as a transparent overlay on all property images</p>
                 <p>• <strong>No Database Changes:</strong> Agent photos remain unchanged in the database</p>
                 <p>• <strong>Professional Branding:</strong> Logo appears on all property listings and detail pages</p>
                 <p>• <strong>Configurable:</strong> Logo position and size can be adjusted in the component</p>
               </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Property Statistics</h2>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh Stats'}
              </button>
            </div>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalProperties}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalProperties}</div>
                  <div className="text-sm text-gray-600">With Watermark</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Coverage</div>
                </div>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* Results */}
          {updateResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Results</h2>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {updateResults.map((result, index) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Property {result.propertyId}:</span>
                        <span className="ml-2 text-gray-600">{result.title}</span>
                      </div>
                      {result.error ? (
                        <span className="text-red-500 text-sm">Error: {result.error}</span>
                      ) : (
                        <span className="text-green-500 text-sm">
                          Updated: {result.oldImageCount} → {result.newImageCount} images
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
