'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, CheckCircle, XCircle, Clock, Eye, AlertCircle } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

interface AvatarRequest {
  id: string
  fullName: string
  phone: string
  role: string
  currentAvatar?: string
  request: {
    requestedAvatar: string
    requestedAt: string
    status: 'pending' | 'approved' | 'rejected'
    reviewedBy?: string
    reviewedAt?: string
    rejectionReason?: string
  }
  createdAt: string
}

export default function AvatarRequestsPage() {
  const { user, isAuthenticated } = useUser()
  const [requests, setRequests] = useState<AvatarRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<AvatarRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests()
    }
  }, [isAuthenticated])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/avatar-requests')
      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data)
      } else {
        setError(data.error || 'Failed to fetch requests')
      }
    } catch (error) {
      setError('Error fetching requests')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(userId)
      setError(null)

      const body: any = { userId, action }
      if (action === 'reject' && rejectionReason) {
        body.rejectionReason = rejectionReason
      }

      const response = await fetch('/api/admin/avatar-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the requests list
        await fetchRequests()
        setSelectedRequest(null)
        setRejectionReason('')
      } else {
        setError(data.error || 'Failed to process request')
      }
    } catch (error) {
      setError('Error processing request')
      console.error('Error:', error)
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need superadmin privileges to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Avatar Change Requests</h1>
          <p className="text-gray-600">Review and manage agent avatar change requests</p>
        </motion.div>

        {/* Error Alert */}
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

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">All avatar change requests have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* User Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                          {request.currentAvatar ? (
                            <img 
                              src={request.currentAvatar} 
                              alt={request.fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.fullName}</h3>
                      <p className="text-sm text-gray-600">{request.phone}</p>
                      <p className="text-sm text-gray-600 capitalize">{request.role}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.request.status)}`}>
                      {getStatusIcon(request.request.status)}
                      <span className="ml-1">{request.request.status}</span>
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Requested:</span>
                      <span>{new Date(request.request.requestedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {request.request.status === 'pending' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Avatar Change Request</h2>
                  
                  {/* User Info */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                          {selectedRequest.currentAvatar ? (
                            <img 
                              src={selectedRequest.currentAvatar} 
                              alt={selectedRequest.fullName} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedRequest.fullName}</h3>
                      <p className="text-gray-600">{selectedRequest.phone}</p>
                      <p className="text-gray-600 capitalize">{selectedRequest.role}</p>
                    </div>
                  </div>

                  {/* Avatar Comparison */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Current Avatar</h4>
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg mx-auto">
                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                          {selectedRequest.currentAvatar ? (
                            <img 
                              src={selectedRequest.currentAvatar} 
                              alt="Current" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-16 h-16 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Requested Avatar</h4>
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 p-[3px] shadow-lg mx-auto">
                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                          <img 
                            src={selectedRequest.request.requestedAvatar} 
                            alt="Requested" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedRequest.id, 'reject')}
                      disabled={processing === selectedRequest.id}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {processing === selectedRequest.id ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedRequest.id, 'approve')}
                      disabled={processing === selectedRequest.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {processing === selectedRequest.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
