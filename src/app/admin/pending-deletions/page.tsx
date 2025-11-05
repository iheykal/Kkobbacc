'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { formatPrice } from '@/lib/utils'
import { propertyEventManager } from '@/lib/propertyEvents'
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Eye,
  User,
  Calendar,
  MapPin
} from 'lucide-react'

interface PendingDeletion {
  _id: string
  propertyId: number
  title: string
  location: string
  price: number
  listingType: string
  agent: {
    name: string
    phone: string
    image: string
    rating: number
  }
  agentId: {
    _id: string
    fullName: string
    email: string
    phone: string
  }
  deletionRequestedAt: string
  deletionRequestedBy: string
  createdAt: string
}

export default function PendingDeletionsPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeletion, setConfirmingDeletion] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (contextUser && (contextUser.role === 'superadmin' || contextUser.role === 'super_admin')) {
      fetchPendingDeletions()
    } else if (contextUser) {
      setError('Access denied. Only superadmin can view pending deletions.')
      setLoading(false)
    }
  }, [contextUser, isAuthenticated, contextLoading, router])

  const fetchPendingDeletions = async () => {
    try {
      console.log('🔄 Fetching pending deletions...')
      const response = await fetch('/api/properties/pending-deletion', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Pending deletions fetched:', result.data?.length || 0)
        setPendingDeletions(result.data || [])
        setError(null)
      } else {
        console.error('❌ Failed to fetch pending deletions:', response.status)
        setError('Failed to fetch pending deletions')
      }
    } catch (error) {
      console.error('❌ Error fetching pending deletions:', error)
      setError('Error fetching pending deletions')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDeletion = async (propertyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this property? This action cannot be undone and will remove all data from the system.')) {
      return
    }

    try {
      setConfirmingDeletion(propertyId)
      console.log('🔄 Confirming deletion for property:', propertyId)
      
      const response = await fetch(`/api/properties/${propertyId}/confirm-deletion`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()
      if (response.ok) {
        // Immediately remove the item from the UI for better UX
        setPendingDeletions(prev => prev.filter(item => item._id !== propertyId))
        
        // Notify other components about the deletion
        propertyEventManager.notifyDeleted(propertyId)
        
        // Show success message
        setSuccessMessage('Property has been permanently deleted from the system.')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
        
        // Also refresh the list to ensure consistency
        fetchPendingDeletions()
      } else {
        alert(result?.error || 'Failed to confirm deletion')
      }
    } catch (error) {
      console.error('❌ Error confirming deletion:', error)
      alert('Error confirming deletion')
    } finally {
      setConfirmingDeletion(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Don't render anything until authentication check is complete
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pending Deletions</h1>
              <p className="text-gray-600">Review and confirm property deletion requests</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Deletions</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{pendingDeletions.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Requests</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {pendingDeletions.filter(p => {
                    const today = new Date().toDateString()
                    return new Date(p.deletionRequestedAt).toDateString() === today
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Agents</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {new Set(pendingDeletions.map(p => (p.agentId as any)._id)).size}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Deletions List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Properties Pending Deletion</h2>
            <p className="text-gray-600 mt-1">Review and confirm deletion requests from agents</p>
          </div>

          {pendingDeletions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending deletions</h3>
              <p className="text-gray-600">All deletion requests have been processed</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <AnimatePresence>
                {pendingDeletions.map((deletion, index) => (
                  <motion.div
                    key={deletion._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                            ID: {deletion.propertyId}
                          </div>
                          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            Pending Deletion
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {deletion.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{deletion.location}</span>
                          </div>
                          <div 
                            className="font-semibold text-green-600"
                            dangerouslySetInnerHTML={{ __html: formatPrice(deletion.price, deletion.listingType) }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Requested by:</p>
                            <p className="font-medium">{deletion.deletionRequestedBy}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Agent:</p>
                            <p className="font-medium">{deletion.agentId.fullName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Requested at:</p>
                            <p className="font-medium">{formatDate(deletion.deletionRequestedAt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Property created:</p>
                            <p className="font-medium">{formatDate(deletion.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        <button
                          onClick={() => handleConfirmDeletion(deletion._id)}
                          disabled={confirmingDeletion === deletion._id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {confirmingDeletion === deletion._id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirm Deletion</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
