'use client'


export const dynamic = 'force-dynamic';
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  Building
} from 'lucide-react'

export default function FixPropertyTypesPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixPropertyTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch('/api/admin/fix-property-types', {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setResult(result.data)
      } else {
        setError(result.error || 'Failed to fix property types')
      }
    } catch (error) {
      console.error('Error fixing property types:', error)
      setError('Failed to fix property types')
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

  if (!isAuthenticated || (contextUser && contextUser.role !== 'superadmin' && contextUser.role !== 'super_admin')) {
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Fix Property Types</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <Building className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Fix Invalid Property Types
            </h2>
            <p className="text-gray-600">
              This tool will fix properties with invalid property types (like "single-family") 
              and update them to use valid property types from your dropdown options.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Valid Property Types:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['villa', 'bacweyne', 'apartment', 'dabaq', 'condo', 'townhouse', 'luxury', 'penthouse', 'mansion', 'estate'].map((type) => (
                <div key={type} className="bg-white rounded-lg px-3 py-2 text-sm font-medium text-blue-700">
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={fixPropertyTypes}
              disabled={loading}
              className="px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Fixing Property Types...</span>
                </>
              ) : (
                <>
                  <Building className="w-5 h-5" />
                  <span>Fix Property Types</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Error:</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-800 font-semibold text-lg">Success!</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-green-700">{result.message}</p>
                
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Summary:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Properties Fixed:</span>
                      <span className="ml-2 text-gray-900">{result.modifiedCount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Invalid Types Found:</span>
                      <span className="ml-2 text-gray-900">{result.invalidPropertiesFound}</span>
                    </div>
                  </div>
                </div>

                {result.invalidPropertyTypes && result.invalidPropertyTypes.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Invalid Property Types Found:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.invalidPropertyTypes.map((type: string) => (
                        <span key={type} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Back to Admin Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
