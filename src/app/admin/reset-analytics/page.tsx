'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { 
  ArrowLeft,
  BarChart3,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function ResetAnalyticsPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetData, setResetData] = useState<any>(null)

  const handleResetAnalytics = async () => {
    if (!confirm('⚠️ Are you sure you want to reset ALL analytics data?\n\nThis will clear:\n• All view counts\n• All view history\n• All agent statistics\n• All analytics data\n\nThis action cannot be undone!')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/admin/reset-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess('Analytics reset completed successfully!')
        setResetData(data.data)
      } else {
        setError(data.error || 'Failed to reset analytics')
      }
    } catch (error) {
      setError('Error resetting analytics')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-red-500">Only superadmin can access this page.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Reset Analytics</h1>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Warning Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Warning: This Action Cannot Be Undone</h3>
                  <p className="text-red-700 mb-4">
                    Resetting analytics will permanently delete all analytics data including:
                  </p>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    <li>All property view counts</li>
                    <li>All unique viewer data</li>
                    <li>All view history and tracking</li>
                    <li>All agent statistics</li>
                    <li>All analytics metrics and reports</li>
                  </ul>
                  <p className="text-red-700 mt-4 font-medium">
                    Your properties will remain intact, but all analytics data will be lost forever.
                  </p>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={handleResetAnalytics}
                disabled={loading}
                className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center gap-3 mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Resetting Analytics...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Reset All Analytics Data
                  </>
                )}
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-800">Success!</h3>
                </div>
                <p className="text-green-700 mt-2">{success}</p>
                
                {resetData && (
                  <div className="mt-4 bg-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Reset Summary:</h4>
                    <ul className="text-green-700 space-y-1">
                      <li>• Properties reset: {resetData.propertiesReset}</li>
                      <li>• Agents reset: {resetData.agentsReset}</li>
                      <li>• Total properties: {resetData.totalProperties}</li>
                      <li>• Properties with views: {resetData.propertiesWithViews}</li>
                      <li>• Agents with views: {resetData.agentsWithViews}</li>
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-800">Error</h3>
                </div>
                <p className="text-red-700 mt-2">{error}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
