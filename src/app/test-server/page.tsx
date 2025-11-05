'use client'

import { useEffect, useState } from 'react'

export default function TestServer() {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const testServer = async () => {
      try {
        console.log('🔍 Testing server connection...')
        
        // Test basic server response
        const response = await fetch('/', { 
          method: 'GET'
        })
        
        console.log('🔍 Server response status:', response.status)
        
        setResult({
          serverStatus: response.status,
          serverOk: response.ok,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('🔍 Server error:', error)
        setResult({ 
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    }
    
    testServer()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Server Connection Test</h1>
      <div className="mb-4">
        <p>Current time: {new Date().toLocaleString()}</p>
        <p>URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      </div>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
