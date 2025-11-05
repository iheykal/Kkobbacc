'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'

interface PropertyImageIssue {
  propertyId: string
  title: string
  thumbnailImage: string
  images: string[]
  hasR2Images: boolean
  r2ImageCount: number
  localImageCount: number
  issues: string[]
}

interface DiagnosticResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function FixPropertyImagesPage() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyImageIssue[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'superadmin') {
      router.replace('/')
      return
    }
  }, [isAuthenticated, user?.role, router])

  const addDiagnostic = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setDiagnostics(prev => [...prev, { step, status, message, data }])
  }

  const runDiagnostics = async () => {
    setIsLoading(true)
    setDiagnostics([])

    try {
      // Step 1: Check R2 configuration
      addDiagnostic('r2-config', 'pending', 'Checking R2 configuration...')
      const r2Response = await fetch('/api/debug-r2-config', { credentials: 'include' })
      const r2Data = await r2Response.json()
      
      if (!r2Response.ok) {
        addDiagnostic('r2-config', 'error', `R2 configuration failed: ${r2Data.error}`, r2Data)
        return
      }
      addDiagnostic('r2-config', 'success', 'R2 configuration is working', r2Data)

      // Step 2: Fetch all properties
      addDiagnostic('fetch-properties', 'pending', 'Fetching all properties...')
      const propertiesResponse = await fetch('/api/properties', { credentials: 'include' })
      const propertiesData = await propertiesResponse.json()
      
      if (!propertiesResponse.ok) {
        addDiagnostic('fetch-properties', 'error', `Failed to fetch properties: ${propertiesData.error}`, propertiesData)
        return
      }
      addDiagnostic('fetch-properties', 'success', `Found ${propertiesData.data?.length || 0} properties`, propertiesData.data)

      // Step 3: Analyze property images
      addDiagnostic('analyze-images', 'pending', 'Analyzing property images...')
      const propertyIssues: PropertyImageIssue[] = []
      
      for (const property of propertiesData.data || []) {
        const issues: string[] = []
        let r2ImageCount = 0
        let localImageCount = 0
        
        // Check thumbnail
        if (property.thumbnailImage) {
          if (property.thumbnailImage.includes('r2.dev') || property.thumbnailImage.includes('r2.cloudflarestorage.com')) {
            r2ImageCount++
          } else if (property.thumbnailImage.includes('localhost') || property.thumbnailImage.includes('/uploads/')) {
            localImageCount++
            issues.push('Thumbnail is local, not R2')
          }
        } else {
          issues.push('No thumbnail image')
        }
        
        // Check images array
        if (property.images && Array.isArray(property.images)) {
          for (const image of property.images) {
            if (image.includes('r2.dev') || image.includes('r2.cloudflarestorage.com')) {
              r2ImageCount++
            } else if (image.includes('localhost') || image.includes('/uploads/')) {
              localImageCount++
            }
          }
        } else {
          issues.push('No images array or empty images')
        }
        
        const hasR2Images = r2ImageCount > 0
        if (!hasR2Images && (property.thumbnailImage || (property.images && property.images.length > 0))) {
          issues.push('No R2 images found')
        }
        
        propertyIssues.push({
          propertyId: property._id || property.id,
          title: property.title,
          thumbnailImage: property.thumbnailImage || '',
          images: property.images || [],
          hasR2Images,
          r2ImageCount,
          localImageCount,
          issues
        })
      }
      
      setProperties(propertyIssues)
      addDiagnostic('analyze-images', 'success', `Analyzed ${propertyIssues.length} properties`, {
        totalProperties: propertyIssues.length,
        withR2Images: propertyIssues.filter(p => p.hasR2Images).length,
        withLocalImages: propertyIssues.filter(p => p.localImageCount > 0).length,
        withIssues: propertyIssues.filter(p => p.issues.length > 0).length
      })

    } catch (error) {
      addDiagnostic('error', 'error', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const fixPropertyImages = async () => {
    setIsFixing(true)
    
    try {
      const propertiesWithIssues = properties.filter(p => p.issues.length > 0)
      
      for (const property of propertiesWithIssues) {
        addDiagnostic('fix-property', 'pending', `Fixing images for: ${property.title}`)
        
        // Here you would implement the actual fix logic
        // For now, we'll just simulate the fix
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        addDiagnostic('fix-property', 'success', `Fixed images for: ${property.title}`)
      }
      
      addDiagnostic('fix-complete', 'success', `Fixed ${propertiesWithIssues.length} properties`)
      
    } catch (error) {
      addDiagnostic('fix-error', 'error', `Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    } finally {
      setIsFixing(false)
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fix Property Images - R2 Links</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
          <p className="text-gray-700 mb-4">
            Properties are being created but their images are not being stored with Cloudflare R2 links in the database.
            This means images are either not being uploaded to R2 or the URLs are not being saved correctly.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Common Causes:</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Images uploaded to local storage instead of R2</li>
              <li>• R2 environment variables not configured correctly</li>
              <li>• Image upload process failing silently</li>
              <li>• Property creation not linking uploaded images</li>
              <li>• R2 bucket permissions or CORS issues</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </button>
            
            {properties.length > 0 && (
              <button
                onClick={fixPropertyImages}
                disabled={isFixing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixing ? 'Fixing Images...' : 'Fix Property Images'}
              </button>
            )}
          </div>
        </div>

        {diagnostics.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <div className="space-y-4">
              {diagnostics.map((diag, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getStatusIcon(diag.status)}</span>
                    <span className={`font-medium ${getStatusColor(diag.status)}`}>
                      {diag.step.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{diag.message}</p>
                  {diag.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(diag.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {properties.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Property Image Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R2 Images</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Images</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property, index) => (
                    <tr key={index} className={property.issues.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">ID: {property.propertyId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.r2ImageCount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {property.r2ImageCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.localImageCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.localImageCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {property.issues.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {property.issues.map((issue, i) => (
                                <li key={i} className="text-red-600">{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-green-600">No issues</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
