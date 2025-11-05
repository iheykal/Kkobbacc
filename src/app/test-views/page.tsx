'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface Property {
  _id: string
  propertyId?: number
  title: string
  viewCount: number
  uniqueViewCount: number
  agent: {
    name: string
    phone: string
    image: string
    rating: number
  }
}

export default function TestViewsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/properties?limit=5')
      const data = await response.json()
      
      if (data.success) {
        setProperties(data.data)
      } else {
        setError('Failed to fetch properties')
      }
    } catch (error) {
      setError('Error fetching properties')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testViewIncrement = async (propertyId: string | number) => {
    try {
      setTesting(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch(`/api/properties/${propertyId}/increment-view`, {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`View incremented successfully! Unique: ${data.data.isUniqueView ? 'Yes' : 'No'}, User Type: ${data.data.userType}`)
        fetchProperties() // Refresh the data
      } else {
        setError(data.error || 'Failed to increment view')
      }
    } catch (error) {
      setError('Error testing view increment')
      console.error('Error:', error)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unique View Tracking Test</h1>
          <p className="text-gray-600">Test the unique view tracking functionality</p>
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

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading properties...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <motion.div
                key={property._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {property.title}
                  </h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Total Views</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {property.viewCount}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-sm text-gray-600">Unique Views</span>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {property.uniqueViewCount}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => testViewIncrement(property.propertyId || property._id)}
                    disabled={testing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Test View Increment
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Test</h2>
          <div className="space-y-2 text-gray-600">
            <p>1. Click "Test View Increment" on any property</p>
            <p>2. The first click should show "Unique: Yes"</p>
            <p>3. Subsequent clicks should show "Unique: No"</p>
            <p>4. Check that uniqueViewCount only increases on first view</p>
            <p>5. Total viewCount should increase on every click</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
