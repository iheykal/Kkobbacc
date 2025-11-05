'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, CheckCircle, XCircle, Clock, User, Shield, AlertCircle, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Agent {
  _id: string
  fullName: string
  phone: string
  role: string
  status: string
  agentProfile: {
    blueTickStatus: 'none' | 'pending' | 'verified' | 'suspended'
    verified: boolean
    verificationHistory: Array<{
      action: string
      reason: string
      adminName: string
      timestamp: string
    }>
  }
}

// Ultimate superadmin protection constants
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

// Helper function to check if user is ultimate superadmin
const isUltimateSuperadmin = (agent: Agent) => {
  return agent.phone === ULTIMATE_SUPERADMIN_PHONE || 
         agent.fullName === ULTIMATE_SUPERADMIN_NAME ||
         agent.fullName.toLowerCase().includes('kobac')
}

export default function BlueTickManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [action, setAction] = useState<'grant' | 'suspend' | 'reinstate'>('grant')
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching agents from admin API...')
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 Admin API response:', data)
      
      if (data.success) {
        // Filter only agents and agencies
        const agentUsers = data.data.filter((user: any) => 
          ['agent', 'agency'].includes(user.role)
        )
        console.log('🔍 Filtered agents:', agentUsers.length)
        setAgents(agentUsers)
      } else {
        setError(data.error || 'Failed to fetch agents')
      }
    } catch (error) {
      console.error('❌ Error fetching agents:', error)
      setError(`Error fetching agents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBlueTickAction = async () => {
    if (!selectedAgent || !reason.trim()) {
      alert('Please select an agent and provide a reason')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedAgent._id}/blue-tick`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action, reason })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`Blue tick ${action}ed successfully`)
        setSelectedAgent(null)
        setReason('')
        fetchAgents() // Refresh the list
      } else {
        alert(data.error || 'Failed to update blue tick status')
      }
    } catch (error) {
      alert('Error updating blue tick status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'suspended':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <User className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-xl text-slate-600">Loading agents...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Blue Tick Management</h1>
              <p className="text-slate-600">Manage agent verification and blue tick status</p>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-3xl font-bold text-green-600">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'verified').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-3xl font-bold text-red-600">
                  {agents.filter(a => a.agentProfile?.blueTickStatus === 'suspended').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Agents List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Agent Verification Status</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {agents.map((agent, index) => (
              <motion.div
                key={agent._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {agent.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{agent.fullName}</h3>
                        {isUltimateSuperadmin(agent) && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border border-blue-500 shadow-lg">
                            <div className="relative">
                              <Shield className="w-3 h-3 text-white drop-shadow-sm" />
                              <Crown className="w-2 h-2 text-yellow-300 absolute -top-0.5 -right-0.5" />
                            </div>
                            <span>SUPERADMIN</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{agent.phone}</p>
                      <p className="text-xs text-gray-500 capitalize">{agent.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(agent.agentProfile?.blueTickStatus || 'none')}`}>
                      {getStatusIcon(agent.agentProfile?.blueTickStatus || 'none')}
                      <span className="capitalize">{agent.agentProfile?.blueTickStatus || 'none'}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {selectedAgent && (
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
                className="bg-white rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4">Manage Blue Tick</h3>
                <p className="text-gray-600 mb-4">Agent: <span className="font-semibold">{selectedAgent.fullName}</span></p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value as any)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="grant">Grant Blue Tick</option>
                      <option value="suspend">Suspend Blue Tick</option>
                      <option value="reinstate">Reinstate Blue Tick</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Provide a reason for this action..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedAgent(null)
                      setReason('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBlueTickAction}
                    className="flex-1"
                  >
                    Confirm
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
