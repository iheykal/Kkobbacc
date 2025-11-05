'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestAuth() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const testAuth = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔐 Testing authentication...')
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      const result = await response.json()
      console.log('🔐 Auth result:', result)
      
      if (response.ok && result.data) {
        setMessage(`✅ Authenticated as: ${result.data.fullName} (${result.data.role})`)
      } else {
        setMessage(`❌ Not authenticated: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Auth test error:', error)
      setMessage(`❌ Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testAdminUsers = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('👑 Testing admin users API...')
      const response = await fetch('/api/admin/users?role=agent,agency', {
        credentials: 'include'
      })
      const result = await response.json()
      console.log('👑 Admin users result:', result)
      
      if (response.ok) {
        setMessage(`✅ Admin users API working! Found ${result.data?.length || 0} agents`)
      } else {
        setMessage(`❌ Admin users API failed: ${result.error} (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('❌ Admin users test error:', error)
      setMessage(`❌ Admin users test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testRestore = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔄 Testing restore API...')
      const response = await fetch('/api/admin/restore-agent-images', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      console.log('🔄 Restore result:', result)
      
      if (response.ok) {
        setMessage(`✅ Restore API working! Restored ${result.data?.restoredCount || 0} images`)
      } else {
        setMessage(`❌ Restore API failed: ${result.error} (Status: ${response.status})`)
      }
    } catch (error) {
      console.error('❌ Restore test error:', error)
      setMessage(`❌ Restore test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Authentication Test</h2>
          <p className="text-purple-200 mt-2">Debug 401 errors</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 space-y-4">
          <button
            onClick={testAuth}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            🔐 Test Authentication
          </button>

          <button
            onClick={testAdminUsers}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            👑 Test Admin Users API
          </button>

          <button
            onClick={testRestore}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            🔄 Test Restore API
          </button>

          {message && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white text-sm whitespace-pre-wrap">{message}</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin/agents')}
            className="text-purple-300 hover:text-white transition-colors"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
