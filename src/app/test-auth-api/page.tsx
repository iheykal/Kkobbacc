'use client'

import { useEffect, useState } from 'react'

export default function TestAuthAPI() {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const testAuth = async () => {
      try {
        console.log('🔍 Testing auth API...')
        const response = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('🔍 Response status:', response.status)
        console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()))
        
        const data = await response.json()
        console.log('🔍 Response data:', data)
        
        setResult({
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data
        })
      } catch (error) {
        console.error('🔍 Error:', error)
        setResult({ error: error instanceof Error ? error.message : String(error) })
      }
    }
    
    testAuth()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth API Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
