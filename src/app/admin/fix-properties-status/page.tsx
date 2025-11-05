'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react'

export default function FixPropertiesStatusPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixPropertiesStatus = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/fix-properties-status', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to fix properties status')
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
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fix Properties Status</h1>
            <p className="text-gray-600">
              Fix uploaded properties that might not be appearing due to incorrect deletion status
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              What this tool does:
            </h3>
            <ul className="text-blue-800 space-y-2">
              <li>• Finds properties with missing or incorrect deletionStatus</li>
              <li>• Sets deletionStatus to 'active' for properties that should be visible</li>
              <li>• Ensures uploaded properties appear on the main page</li>
              <li>• Fixes properties that might be hidden due to status issues</li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={fixPropertiesStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors duration-300 flex items-center justify-center mx-auto space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Fixing Properties...</span>
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  <span>Fix Properties Status</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Error:</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Success!</span>
              </div>
              <div className="text-green-700 mt-2 space-y-1">
                <p>Properties processed: {result.totalProcessed}</p>
                <p>Properties fixed: {result.fixedCount}</p>
                <p>Properties already correct: {result.alreadyCorrect}</p>
                {result.fixedProperties && result.fixedProperties.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold">Fixed properties:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {result.fixedProperties.map((prop: any, index: number) => (
                        <li key={index} className="text-sm">
                          {prop.title} (ID: {prop.propertyId || prop._id})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
