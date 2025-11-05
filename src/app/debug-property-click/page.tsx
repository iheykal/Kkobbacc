'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, AlertTriangle, Eye, Bug } from 'lucide-react'

export default function DebugPropertyClickPage() {
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [clickLog, setClickLog] = useState<string[]>([])

  useEffect(() => {
    // Add click listener to track all clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const propertyCard = target.closest('[data-property-card]')
      
      if (propertyCard) {
        const propertyData = propertyCard.getAttribute('data-property-data')
        setClickLog(prev => [...prev, `Property card clicked: ${propertyData}`])
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const testNavigation = () => {
    setClickLog(prev => [...prev, `Testing navigation to /iib/1 at ${new Date().toLocaleTimeString()}`])
    router.push('/iib/1')
  }

  const testMainPage = () => {
    setClickLog(prev => [...prev, `Testing navigation to main page at ${new Date().toLocaleTimeString()}`])
    router.push('/')
  }

  const clearLog = () => {
    setClickLog([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Click Debug</h1>
            <p className="text-gray-600">Debugging property card click behavior and navigation</p>
          </div>

          {/* Debug Information */}
          <div className="mb-8 p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center space-x-3 mb-4">
              <Bug className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-blue-900">Debug Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-md border">
                <h3 className="font-semibold text-gray-900 mb-2">Current Environment:</h3>
                <ul className="space-y-1 text-gray-700">
                  <li>• Window: {typeof window !== 'undefined' ? 'Available' : 'Not available'}</li>
                  <li>• Router: Available</li>
                  <li>• Location: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</li>
                  <li>• User Agent: {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</li>
                </ul>
              </div>
              
              <div className="bg-white p-3 rounded-md border">
                <h3 className="font-semibold text-gray-900 mb-2">Navigation Status:</h3>
                <ul className="space-y-1 text-gray-700">
                  <li>• Router.push: Available</li>
                  <li>• Client-side routing: Enabled</li>
                  <li>• History API: {typeof window !== 'undefined' && 'history' in window ? 'Available' : 'Not available'}</li>
                  <li>• SessionStorage: {typeof window !== 'undefined' && 'sessionStorage' in window ? 'Available' : 'Not available'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Click Log */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Click Log</h2>
              <button
                onClick={clearLog}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear Log
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
              {clickLog.length === 0 ? (
                <p className="text-gray-500 text-sm">No clicks logged yet...</p>
              ) : (
                <div className="space-y-1">
                  {clickLog.map((log, index) => (
                    <div key={index} className="text-sm text-gray-700 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Navigation */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Navigation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Test Direct Navigation</h3>
                <p className="text-sm text-green-800 mb-3">
                  Test direct navigation to property page to see if the issue is with the navigation itself.
                </p>
                <button
                  onClick={testNavigation}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Test Property Navigation</span>
                </button>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Test Main Page</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Go to main page to test property card clicks and see what happens.
                </p>
                <button
                  onClick={testMainPage}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Go to Main Page</span>
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-8">
            <h3 className="font-semibold text-yellow-900 mb-2">Debug Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
              <li><strong>Test Direct Navigation:</strong> Click "Test Property Navigation" to see if direct navigation works</li>
              <li><strong>Test Main Page:</strong> Click "Go to Main Page" and then click a property card</li>
              <li><strong>Monitor Console:</strong> Open DevTools Console to see any errors or logs</li>
              <li><strong>Check Network:</strong> Monitor Network tab to see if there are any full page reloads</li>
              <li><strong>Watch Click Log:</strong> The click log above will show any property card clicks</li>
            </ol>
          </div>

          {/* Potential Issues */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">Potential Issues to Check:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              <li>Property data structure issues (missing propertyId or _id)</li>
              <li>Router.push being called multiple times</li>
              <li>Event propagation issues with click handlers</li>
              <li>Component re-rendering causing navigation conflicts</li>
              <li>Browser compatibility issues with Next.js routing</li>
              <li>State management conflicts</li>
            </ul>
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
