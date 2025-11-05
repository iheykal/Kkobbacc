'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  Database,
  Image,
  Trash2
} from 'lucide-react'

interface FixResult {
  propertiesProcessed: number
  propertiesFixed: number
  totalDuplicatesRemoved: number
  fixedProperties: Array<{
    id: string
    title: string
    duplicatesRemoved: number
    originalCount: number
    newCount: number
  }>
}

export default function FixThumbnailDuplicationPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runFix = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/fix-thumbnail-duplication', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Failed to run thumbnail duplication fix')
      }
    } catch (err) {
      setError('Network error occurred while running the fix')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a
                href="/admin"
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </a>
              <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Fix Thumbnail Duplication
                </h1>
                <p className="text-sm text-gray-600">Fix existing properties with duplicate thumbnails</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Description Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg mb-8"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-blue-100">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Thumbnail Duplication Issue
              </h2>
              <p className="text-gray-600 mb-4">
                Some existing properties have their thumbnail image appearing multiple times in the 
                property detail page gallery. This happens when the thumbnail image is also included 
                in the additional images array.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>What this fix does:</strong> Removes duplicate thumbnail images from the 
                  additional images array, ensuring each image appears only once in the gallery.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Run Thumbnail Duplication Fix
              </h3>
              <p className="text-gray-600">
                This will scan all properties and remove duplicate thumbnails from the additional images array.
              </p>
            </div>
            <button
              onClick={runFix}
              disabled={isRunning}
              className="group relative px-8 py-4 bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 text-white rounded-2xl hover:from-orange-700 hover:via-orange-800 hover:to-red-800 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 disabled:transform-none"
            >
              {isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running Fix...</span>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span>Run Fix</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-semibold">Error</h4>
                <p>{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 rounded-2xl bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Fix Completed Successfully</h3>
                  <p className="text-gray-600">Thumbnail duplication has been resolved</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Properties Processed</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{result.propertiesProcessed}</div>
                </div>

                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Properties Fixed</span>
                  </div>
                  <div className="text-3xl font-bold text-green-900">{result.propertiesFixed}</div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center space-x-3 mb-2">
                    <Trash2 className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Duplicates Removed</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-900">{result.totalDuplicatesRemoved}</div>
                </div>
              </div>

              {/* Fixed Properties List */}
              {result.fixedProperties.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Fixed Properties</h4>
                  <div className="space-y-3">
                    {result.fixedProperties.map((property, index) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{property.title}</p>
                            <p className="text-sm text-gray-600">
                              {property.duplicatesRemoved} duplicate(s) removed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {property.originalCount} → {property.newCount} images
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold">Success!</h4>
                  <p>
                    The thumbnail duplication fix has been completed successfully. 
                    {result.propertiesFixed > 0 
                      ? ` ${result.propertiesFixed} properties were fixed, removing ${result.totalDuplicatesRemoved} duplicate thumbnails.`
                      : ' No properties required fixing.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

