'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginTest() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      })

      const result = await response.json()
      console.log('Login result:', result)

      if (response.ok && result.success) {
        setMessage(`✅ Login successful! Role: ${result.data.role}`)
        
        // Test authentication
        setTimeout(async () => {
          const authResponse = await fetch('/api/auth/me')
          const authResult = await authResponse.json()
          console.log('Auth test result:', authResult)
          
          if (authResponse.ok && authResult.user) {
            setMessage(`✅ Authenticated as: ${authResult.user.fullName} (${authResult.user.role})`)
            
            if (authResult.user.role === 'superadmin') {
              setMessage(`✅ SuperAdmin authenticated! Redirecting to admin dashboard...`)
              setTimeout(() => {
                router.push('/admin/agents')
              }, 2000)
            }
          } else {
            setMessage(`❌ Auth test failed: ${authResult.error}`)
          }
        }, 1000)
      } else {
        setMessage(`❌ Login failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      console.log('Auth test:', result)
      
      if (response.ok && result.user) {
        setMessage(`✅ Currently authenticated as: ${result.user.fullName} (${result.user.role})`)
      } else {
        setMessage(`❌ Not authenticated: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Auth test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">SuperAdmin Login Test</h2>
          <p className="text-purple-200 mt-2">Test authentication and access</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={testAuth}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Test Current Authentication
            </button>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <p className="text-white text-sm">{message}</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin/agents')}
            className="text-purple-300 hover:text-white transition-colors"
          >
            Try Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
