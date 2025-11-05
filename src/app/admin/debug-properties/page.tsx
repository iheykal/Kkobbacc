'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface DebugResults {
  success: boolean
  message: string
  action: string
  propertyId?: number | string
  data?: any
}

export default function PropertyDebuggerPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugResults | null>(null)
  const [error, setError] = useState('')

  const debugProperty = async (propertyId: number) => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/admin/debug-and-fix-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'debug',
          propertyId: propertyId
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to debug property')
    } finally {
      setLoading(false)
    }
  }

  const fixProperty = async (propertyId: number) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/debug-and-fix-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'fix',
          propertyId: propertyId
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        alert('Property fixed successfully!')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fix property')
    } finally {
      setLoading(false)
    }
  }

  const debugAllProperties = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch('/api/admin/debug-and-fix-properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'debug'
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to debug properties')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Property Debugger & Fixer
          </h1>
          <p className="text-gray-600">
            Debug and fix existing properties with image issues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debug Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property ID
                </label>
                <input
                  type="number"
                  placeholder="Enter property ID (e.g., 125)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="propertyId"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const element = document.getElementById('propertyId') as HTMLInputElement
                    const propertyId = element?.value
                    if (propertyId) {
                      debugProperty(parseInt(propertyId))
                    } else {
                      setError('Please enter a property ID')
                    }
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Debugging...' : 'Debug Property'}
                </Button>

                <Button
                  onClick={() => {
                    const element = document.getElementById('propertyId') as HTMLInputElement
                    const propertyId = element?.value
                    if (propertyId) {
                      fixProperty(parseInt(propertyId))
                    } else {
                      setError('Please enter a property ID')
                    }
                  }}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1"
                >
                  {loading ? 'Fixing...' : 'Fix Property'}
                </Button>
              </div>

              <Button
                onClick={debugAllProperties}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Debugging All...' : 'Debug All Properties'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="font-medium text-green-800 mb-2">
                      ✅ {results.message}
                    </h3>
                    <p className="text-green-700 text-sm">
                      Action: {results.action} | Property: {results.propertyId || 'All'}
                    </p>
                  </div>

                  {results.data && (
                    <div className="bg-gray-50 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Analysis Results:</h4>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                        {JSON.stringify(results.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {!results && !error && (
                <div className="text-center text-gray-500 py-8">
                  <p>No results yet. Use the controls to debug properties.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <strong>Debug Property:</strong> Analyzes a specific property for image issues
              </div>
              <div>
                <strong>Fix Property:</strong> Automatically fixes bucket name issues in a property
              </div>
              <div>
                <strong>Debug All Properties:</strong> Scans all properties for issues (limited to 50)
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <strong>Common Issues:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Missing thumbnail image</li>
                  <li>Empty images array</li>
                  <li>Wrong bucket name in URLs</li>
                  <li>Broken or inaccessible image URLs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
