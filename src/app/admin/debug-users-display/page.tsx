'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'

interface DebugInfo {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function DebugUsersDisplayPage() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const [debugSteps, setDebugSteps] = useState<DebugInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'superadmin') {
      router.replace('/')
      return
    }
  }, [isAuthenticated, user?.role, router])

  const addDebugStep = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setDebugSteps(prev => [...prev, { step, status, message, data }])
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    setDebugSteps([])

    try {
      // Step 1: Check authentication
      addDebugStep('auth', 'pending', 'Checking authentication...')
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' })
      const authData = await authResponse.json()
      
      if (!authResponse.ok) {
        addDebugStep('auth', 'error', `Authentication failed: ${authData.error}`, authData)
        return
      }
      addDebugStep('auth', 'success', `Authenticated as: ${authData.data?.fullName} (${authData.data?.role})`, authData.data)

      // Step 2: Check database connection
      addDebugStep('db', 'pending', 'Checking database connection...')
      const dbResponse = await fetch('/api/admin/check-database-collections', { credentials: 'include' })
      const dbData = await dbResponse.json()
      
      if (!dbResponse.ok) {
        addDebugStep('db', 'error', `Database check failed: ${dbData.error}`, dbData)
        return
      }
      addDebugStep('db', 'success', `Database connected. Users: ${dbData.results?.usersCollection?.count || 0}`, dbData.results)

      // Step 3: Test admin users API
      addDebugStep('api', 'pending', 'Testing /api/admin/users endpoint...')
      const usersResponse = await fetch('/api/admin/users', { credentials: 'include' })
      const usersData = await usersResponse.json()
      
      if (!usersResponse.ok) {
        addDebugStep('api', 'error', `Admin users API failed: ${usersData.error}`, usersData)
        return
      }
      addDebugStep('api', 'success', `Found ${usersData.data?.length || 0} users`, usersData.data)

      // Step 4: Test specific role filtering
      addDebugStep('filter', 'pending', 'Testing role filtering...')
      const agentsResponse = await fetch('/api/admin/users?role=agent,agency', { credentials: 'include' })
      const agentsData = await agentsResponse.json()
      
      if (!agentsResponse.ok) {
        addDebugStep('filter', 'error', `Role filtering failed: ${agentsData.error}`, agentsData)
        return
      }
      addDebugStep('filter', 'success', `Found ${agentsData.data?.length || 0} agents/agencies`, agentsData.data)

      // Step 5: Check user roles in database
      addDebugStep('roles', 'pending', 'Analyzing user roles...')
      const roleAnalysis = usersData.data?.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {})
      addDebugStep('roles', 'success', `Role distribution: ${JSON.stringify(roleAnalysis)}`, roleAnalysis)

    } catch (error) {
      addDebugStep('error', 'error', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'success': return '✅'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return <div className="p-8">Access denied. Superadmin required.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Users Display Issue</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
          <p className="text-gray-700 mb-4">
            Users and agents are being saved to MongoDB successfully, but they're not showing up in the superadmin dashboard.
          </p>
          <p className="text-gray-600 text-sm">
            This diagnostic will help identify where the issue is occurring in the data flow.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>
        </div>

        {debugSteps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <div className="space-y-4">
              {debugSteps.map((step, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getStatusIcon(step.status)}</span>
                    <span className={`font-medium ${getStatusColor(step.status)}`}>
                      {step.step.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{step.message}</p>
                  {step.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Common Solutions</h3>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Check if your session cookie is being sent correctly</li>
            <li>• Verify that your user role is 'superadmin' in the database</li>
            <li>• Ensure the MongoDB connection is working properly</li>
            <li>• Check if there are any CORS issues with the API calls</li>
            <li>• Verify that the User model schema matches the data structure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
