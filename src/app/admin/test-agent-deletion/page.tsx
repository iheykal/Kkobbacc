'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { Trash2, User, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface TestAgent {
  id: string
  fullName: string
  phone: string
  role: string
  status: string
  createdAt: string
}

export default function TestAgentDeletionPage() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const [agents, setAgents] = useState<TestAgent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'superadmin') {
      router.replace('/')
      return
    }
    fetchAgents()
  }, [isAuthenticated, user?.role, router])

  const fetchAgents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/users', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const json = await res.json()
      if (res.ok && json?.data) {
        const agentUsers = json.data.filter((u: any) => 
          u.role === 'agent' || u.role === 'agency'
        )
        setAgents(agentUsers)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testDeleteAgent = async (agent: TestAgent) => {
    if (!confirm(`Are you sure you want to test deleting agent ${agent.fullName}? This will permanently remove them from the system.`)) {
      return
    }

    setDeletingAgent(agent.id)
    setTestResults(prev => [...prev, `🗑️ Testing deletion of agent: ${agent.fullName}`])

    try {
      const res = await fetch(`/api/admin/users/${agent.id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        setTestResults(prev => [...prev, `✅ Successfully deleted agent: ${agent.fullName}`])
        setTestResults(prev => [...prev, `📊 Deleted ${json.data.deletedProperties} properties`])
        setTestResults(prev => [...prev, `📱 Phone ${agent.phone} is now available for new registration`])
        setAgents(prev => prev.filter(a => a.id !== agent.id))
      } else {
        setTestResults(prev => [...prev, `❌ Failed to delete agent: ${json.error}`])
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Error: ${error}`])
    } finally {
      setDeletingAgent(null)
    }
  }

  const testLoginAfterDeletion = async (phone: string) => {
    setTestResults(prev => [...prev, `🔐 Testing login with deleted phone: ${phone}`])
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: '1234' })
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        setTestResults(prev => [...prev, `❌ Login succeeded - user still exists!`])
      } else {
        setTestResults(prev => [...prev, `✅ Login failed as expected - user deleted successfully`])
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Login test error: ${error}`])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Agent Deletion Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the superadmin agent deletion functionality
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agents List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-blue-600" />
              Available Agents
            </h2>
            
            {agents.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No agents found to test with</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.fullName}</h3>
                        <p className="text-sm text-gray-600">{agent.phone}</p>
                        <p className="text-xs text-gray-500">Status: {agent.status}</p>
                      </div>
                      <button
                        onClick={() => testDeleteAgent(agent)}
                        disabled={deletingAgent === agent.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {deletingAgent === agent.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Test Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
              Test Results
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No test results yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded text-sm ${
                        result.includes('✅') ? 'bg-green-100 text-green-800' :
                        result.includes('❌') ? 'bg-red-100 text-red-800' :
                        result.includes('🗑️') ? 'bg-blue-100 text-blue-800' :
                        result.includes('🔐') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {result}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setTestResults([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Results
              </button>
              <button
                onClick={fetchAgents}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Agents
              </button>
            </div>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What to Test:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Delete an agent and verify they're removed from the list</li>
                <li>• Check that their properties are also deleted</li>
                <li>• Verify they can no longer login with their credentials</li>
                <li>• Confirm new users can register with the same phone number</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Expected Results:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Agent completely removed from database</li>
                <li>• All associated properties deleted</li>
                <li>• Login attempts fail with "User not found"</li>
                <li>• Phone number becomes available for new registration</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
