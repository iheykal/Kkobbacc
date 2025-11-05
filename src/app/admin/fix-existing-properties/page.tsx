'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function FixExistingPropertiesPage() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not superadmin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'superadmin') {
      router.push('/admin')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return null
  }

  const handleFixProperties = async () => {
    if (!confirm('This will update all existing properties with placeholder images. Continue?')) {
      return
    }

    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/admin/fix-existing-properties', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setError(data.error || 'Failed to fix properties')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Fix Existing Properties
            </h1>
          </div>
          
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">⚠️ What This Does:</h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Finds all properties with placeholder images (picsum.photos, placeholder.com, etc.)</li>
              <li>• Finds all properties with empty or missing images</li>
              <li>• Removes placeholder images and sets them to empty (shows neutral placeholder)</li>
              <li>• This prepares properties to use real uploaded images from Cloudflare R2</li>
              <li>• Properties will show neutral gray placeholders instead of stock photos</li>
            </ul>
          </div>

          <div className="mb-6">
            <Button
              onClick={handleFixProperties}
              disabled={isRunning}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fixing Properties...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Fix Existing Properties
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-800">Error</h3>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-green-800">Fix Completed</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.fixed}</div>
                    <div className="text-sm text-green-700">Fixed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{results.errors}</div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>

                <p className="text-sm text-green-700">
                  Successfully fixed {results.fixed} out of {results.total} properties with placeholder images.
                </p>
              </div>

              {results.details && results.details.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Details:</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.details.map((detail: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{detail.title}</div>
                            <div className="text-sm text-gray-500">ID: {detail.propertyId}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {detail.status === 'fixed' && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Fixed
                              </span>
                            )}
                            {detail.status === 'skipped' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Skipped
                              </span>
                            )}
                            {detail.status === 'error' && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {detail.status === 'fixed' && (
                          <div className="text-xs text-gray-600 space-y-1">
                            <div><span className="font-medium">Fix Type:</span> {detail.fixType}</div>
                            <div><span className="font-medium">Thumbnail:</span> {detail.oldThumbnail} → {detail.newThumbnail}</div>
                            <div><span className="font-medium">Images:</span> {detail.oldImages} → {detail.newImages}</div>
                          </div>
                        )}
                        
                        {detail.status === 'error' && (
                          <div className="text-xs text-red-600">
                            <span className="font-medium">Error:</span> {detail.error}
                          </div>
                        )}
                        
                        {detail.status === 'skipped' && (
                          <div className="text-xs text-yellow-600">
                            <span className="font-medium">Reason:</span> {detail.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

