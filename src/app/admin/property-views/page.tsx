'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface ViewAnalytics {
  totalProperties: number
  migratedCount: number
  skippedCount: number
}

interface PropertyViewData {
  _id: string
  propertyId?: number
  title: string
  viewCount: number
  uniqueViewCount: number
  engagementRatio: number
}

export default function PropertyViewsPage() {
  const [analytics, setAnalytics] = useState<ViewAnalytics | null>(null)
  const [properties, setProperties] = useState<PropertyViewData[]>([])
  const [loading, setLoading] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/properties')
      const data = await response.json()
      
      if (data.success) {
        const propertiesData = data.data.map((property: any) => ({
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          viewCount: property.viewCount || 0,
          uniqueViewCount: property.uniqueViewCount || 0,
          engagementRatio: property.viewCount > 0 ? (property.uniqueViewCount || 0) / property.viewCount : 0
        }))
        
        setProperties(propertiesData)
        
        const analytics = {
          totalProperties: propertiesData.length,
          migratedCount: propertiesData.filter((p: PropertyViewData) => p.uniqueViewCount !== undefined).length,
          skippedCount: 0
        }
        setAnalytics(analytics)
      } else {
        setError('Failed to fetch properties')
      }
    } catch (error) {
      setError('Error fetching analytics')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const runMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/init-property-views', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Migration completed: ${data.data.migratedCount} properties migrated`)
        setAnalytics(data.data)
        fetchAnalytics() // Refresh the data
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (error) {
      setError('Error running migration')
      console.error('Error:', error)
    } finally {
      setMigrating(false)
    }
  }

  const getEngagementColor = (ratio: number) => {
    if (ratio >= 0.8) return 'text-green-600'
    if (ratio >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property View Analytics</h1>
          <p className="text-gray-600">Track unique views and engagement metrics for properties</p>
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

        {/* Stats Cards */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalProperties}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Migrated Properties</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{analytics.migratedCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skipped Properties</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.skippedCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-yellow-100">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Migration Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={runMigration}
            disabled={migrating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
          >
            {migrating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Run View Migration
              </>
            )}
          </button>
        </motion.div>

        {/* Properties Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Property View Data</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading properties...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement Ratio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property, index) => (
                    <tr key={property._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {property.propertyId || property._id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{property.viewCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-sm text-gray-900">{property.uniqueViewCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className={`w-4 h-4 mr-2 ${getEngagementColor(property.engagementRatio)}`} />
                          <span className={`text-sm font-medium ${getEngagementColor(property.engagementRatio)}`}>
                            {(property.engagementRatio * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
