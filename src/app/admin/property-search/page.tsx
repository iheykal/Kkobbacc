'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { 
  ArrowLeft,
  Search,
  Home,
  Users,
  AlertTriangle
} from 'lucide-react'
import PropertySearch from '@/components/admin/PropertySearch'

export default function PropertySearchPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (contextUser && (contextUser.role === 'superadmin' || contextUser.role === 'super_admin')) {
      setLoading(false)
    } else if (contextUser) {
      setError('Access denied. Only superadmin can access property search.')
      setLoading(false)
    }
  }, [contextUser, isAuthenticated, contextLoading, router])

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Property Search</h1>
            </div>
            
            <div className="text-sm text-gray-600">
              Welcome, {contextUser?.firstName || 'Admin'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Property Search & Management
          </h2>
          <p className="text-gray-600">
            Search for properties by ID and view comprehensive details
          </p>
        </motion.div>

        {/* Property Search Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PropertySearch />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/analytics')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>View Analytics</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
