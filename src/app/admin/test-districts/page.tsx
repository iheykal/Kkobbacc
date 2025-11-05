'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { 
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Home,
  MapPin
} from 'lucide-react'

export default function TestDistrictsPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/test-districts', {
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !contextUser || (contextUser.role !== 'superadmin' && contextUser.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only superadmin can access this page.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Test Dhammaan Degmooyin-ka</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              Welcome, {contextUser?.firstName || 'Admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            District Data Test
          </h2>
          <p className="text-gray-600">
            This page shows what district and property type data exists in your database.
          </p>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Data Display */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.totalProperties}</p>
                  <p className="text-gray-600">Total Properties</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.uniqueDistricts?.length || 0}</p>
                  <p className="text-gray-600">Unique Dhammaan Degmooyin-ka</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{data.uniquePropertyTypes?.length || 0}</p>
                  <p className="text-gray-600">Property Types</p>
                </div>
              </div>
            </div>

            {/* District Counts */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Properties by District</h3>
              {data.districtCounts && data.districtCounts.length > 0 ? (
                <div className="space-y-2">
                  {data.districtCounts.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{item._id || 'No District'}</span>
                      <span className="text-sm font-semibold text-gray-600">{item.count} properties</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No district data found</p>
              )}
            </div>

            {/* Property Type Counts */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Properties by Type</h3>
              {data.propertyTypeCounts && data.propertyTypeCounts.length > 0 ? (
                <div className="space-y-2">
                  {data.propertyTypeCounts.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{item._id || 'No Type'}</span>
                      <span className="text-sm font-semibold text-gray-600">{item.count} properties</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No property type data found</p>
              )}
            </div>

            {/* Sample Properties */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sample Properties (First 20)</h3>
              {data.sampleProperties && data.sampleProperties.length > 0 ? (
                <div className="space-y-2">
                  {data.sampleProperties.map((property: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">ID: {property.propertyId}</p>
                          <p className="text-sm text-gray-600">{property.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">District: {property.district || 'None'}</p>
                          <p className="text-sm text-purple-600">Type: {property.propertyType || 'None'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No properties found</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
