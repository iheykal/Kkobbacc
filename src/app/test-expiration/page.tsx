'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function TestExpirationPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testProperty, setTestProperty] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<string>('')

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      if (testProperty?.expiresAt) {
        const expiresAt = new Date(testProperty.expiresAt)
        const diff = expiresAt.getTime() - new Date().getTime()
        if (diff > 0) {
          const minutes = Math.floor(diff / 60000)
          const seconds = Math.floor((diff % 60000) / 1000)
          setTimeUntilExpiration(`${minutes}m ${seconds}s`)
        } else {
          setTimeUntilExpiration('EXPIRED')
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [testProperty])

  const runExpirationTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-expiration')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Test error:', error)
      setTestResults({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const createTestProperty = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setTestProperty(data.property)
        alert(`Test property created! It will expire in 5 minutes.\n\nProperty ID: ${data.property.propertyId}\nExpires at: ${new Date(data.property.expiresAt).toLocaleString()}`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Create test property error:', error)
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runExpirationTest()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Property Expiration Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the expiration filtering system to ensure expired properties are properly excluded.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={runExpirationTest}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Run Expiration Test
            </Button>
            <Button
              onClick={createTestProperty}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Test Property (Expires in 5 min)
            </Button>
          </div>

          {testProperty && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Test Property Created</h3>
              </div>
              <div className="space-y-1 text-sm text-yellow-800">
                <p><strong>Property ID:</strong> {testProperty.propertyId}</p>
                <p><strong>Title:</strong> {testProperty.title}</p>
                <p><strong>Created:</strong> {new Date(testProperty.createdAt).toLocaleString()}</p>
                <p><strong>Expires At:</strong> {new Date(testProperty.expiresAt).toLocaleString()}</p>
                <p className="font-semibold">
                  <strong>Time Until Expiration:</strong> {timeUntilExpiration}
                </p>
              </div>
            </div>
          )}
        </div>

        {testResults && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{testResults.test?.totalProperties || 0}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{testResults.test?.filteredProperties || 0}</div>
                  <div className="text-sm text-gray-600">Active (Filtered)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{testResults.test?.expiredProperties || 0}</div>
                  <div className="text-sm text-gray-600">Expired</div>
                </div>
                <div className="text-center">
                  {getStatusIcon(testResults.summary?.allTestsPassed)}
                  <div className="text-sm text-gray-600 mt-1">All Tests Passed</div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Cases</h2>
              <div className="space-y-4">
                {testResults.test?.testResults?.map((testCase: any, index: number) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      testCase.matchesFilter ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(testCase.matchesFilter)}
                          <h3 className="font-semibold text-gray-900">{testCase.name}</h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Matching Properties: {testCase.matchingCount}</p>
                          <p>Should Be Excluded: {testCase.shouldBeExcluded ? 'Yes' : 'No'}</p>
                          <p>Matches Filter: {testCase.matchesFilter ? 'Yes ✓' : 'No ✗'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Query Details */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Query Details</h2>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800">
                  {JSON.stringify(testResults.query, null, 2)}
                </pre>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Timestamps</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Time:</span>
                  <span className="font-mono">{testResults.test?.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">5 Minutes From Now:</span>
                  <span className="font-mono">{testResults.test?.in5Minutes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Server Time:</span>
                  <span className="font-mono">{currentTime.toISOString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {testResults && !testResults.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Test Error</h3>
            </div>
            <p className="text-red-800 mt-2">{testResults.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

