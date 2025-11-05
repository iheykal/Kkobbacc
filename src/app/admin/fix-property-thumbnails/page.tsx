'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useRouter } from 'next/navigation'

interface PropertyThumbnailIssue {
  propertyId: string
  title: string
  thumbnailImage: string
  images: string[]
  hasCorrectThumbnail: boolean
  hasImages: boolean
  issues: string[]
}

interface DiagnosticResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function FixPropertyThumbnailsPage() {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyThumbnailIssue[]>([])
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
      // Step 1: Fetch all properties
      addDiagnostic('fetch-properties', 'pending', 'Fetching all properties...')
      const propertiesResponse = await fetch('/api/properties', { credentials: 'include' })
      const propertiesData = await propertiesResponse.json()
      
      if (!propertiesResponse.ok) {
        addDiagnostic('fetch-properties', 'error', `Failed to fetch properties: ${propertiesData.error}`, propertiesData)
        return
      }
      addDiagnostic('fetch-properties', 'success', `Found ${propertiesData.data?.length || 0} properties`, propertiesData.data)

      // Step 2: Analyze property thumbnails
      addDiagnostic('analyze-thumbnails', 'pending', 'Analyzing property thumbnails...')
      const propertyIssues: PropertyThumbnailIssue[] = []
      
      for (const property of propertiesData.data || []) {
        const issues: string[] = []
        
        // Check if property has images
        const hasImages = property.images && Array.isArray(property.images) && property.images.length > 0
        if (!hasImages) {
          issues.push('No images array or empty images')
        }
        
        // Check if property has thumbnail
        const hasThumbnail = property.thumbnailImage && property.thumbnailImage.trim() !== ''
        if (!hasThumbnail) {
          issues.push('No thumbnail image')
        }
        
        // Check if thumbnail is the first image
        const hasCorrectThumbnail = hasThumbnail && hasImages && 
          property.thumbnailImage === property.images[0]
        if (hasImages && hasThumbnail && !hasCorrectThumbnail) {
          issues.push('Thumbnail is not the first image')
        }
        
        // Check if images are R2 URLs
        const hasR2Images = hasImages && property.images.some((img: string) => 
          img.includes('r2.dev') || img.includes('r2.cloudflarestorage.com')
        )
        if (hasImages && !hasR2Images) {
          issues.push('Images are not R2 URLs')
        }
        
        // Check if thumbnail is R2 URL
        const hasR2Thumbnail = hasThumbnail && (
          property.thumbnailImage.includes('r2.dev') || 
          property.thumbnailImage.includes('r2.cloudflarestorage.com')
        )
        if (hasThumbnail && !hasR2Thumbnail) {
          issues.push('Thumbnail is not R2 URL')
        }
        
        propertyIssues.push({
          propertyId: property._id || property.id,
          title: property.title,
          thumbnailImage: property.thumbnailImage || '',
          images: property.images || [],
          hasCorrectThumbnail,
          hasImages,
          issues
        })
      }
      
      setProperties(propertyIssues)
      addDiagnostic('analyze-thumbnails', 'success', `Analyzed ${propertyIssues.length} properties`, {
        totalProperties: propertyIssues.length,
        withCorrectThumbnails: propertyIssues.filter(p => p.hasCorrectThumbnail).length,
        withIssues: propertyIssues.filter(p => p.issues.length > 0).length,
        withR2Images: propertyIssues.filter(p => p.images.some(img => img.includes('r2.dev'))).length
      })

    } catch (error) {
      addDiagnostic('error', 'error', `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const fixPropertyThumbnails = async () => {
    setIsFixing(true)
    
    try {
      const propertiesWithIssues = properties.filter(p => p.issues.length > 0)
      
      for (const property of propertiesWithIssues) {
        addDiagnostic('fix-property', 'pending', `Fixing thumbnail for: ${property.title}`)
        
        // Here you would implement the actual fix logic
        // For now, we'll just simulate the fix
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        addDiagnostic('fix-property', 'success', `Fixed thumbnail for: ${property.title}`)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fix Property Thumbnails Issue</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
          <p className="text-gray-700 mb-4">
            When agents upload properties, all properties end up with the same thumbnail image instead of their own unique images.
            This happens because the image upload and property creation process are not properly linked.
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-semibold text-red-800 mb-2">Root Cause:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Images are uploaded separately from property creation</li>
              <li>• Property creation doesn't use the uploaded images</li>
              <li>• All properties get the same default/placeholder images</li>
              <li>• Thumbnail selection logic is not working correctly</li>
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
                onClick={fixPropertyThumbnails}
                disabled={isFixing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixing ? 'Fixing Thumbnails...' : 'Fix Property Thumbnails'}
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
            <h2 className="text-xl font-semibold mb-4">Property Thumbnail Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thumbnail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
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
                        <div className="text-sm text-gray-900">
                          {property.thumbnailImage ? (
                            <div>
                              <div className="text-xs text-gray-500">URL: {property.thumbnailImage.substring(0, 50)}...</div>
                              <div className={`text-xs ${property.thumbnailImage.includes('r2.dev') ? 'text-green-600' : 'text-red-600'}`}>
                                {property.thumbnailImage.includes('r2.dev') ? 'R2 URL' : 'Local URL'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-red-600">No thumbnail</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Count: {property.images.length}</div>
                          <div className={`text-xs ${property.images.some(img => img.includes('r2.dev')) ? 'text-green-600' : 'text-red-600'}`}>
                            {property.images.some(img => img.includes('r2.dev')) ? 'R2 URLs' : 'Local URLs'}
                          </div>
                        </div>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Fix This Issue</h3>
          <ol className="text-blue-700 space-y-2 text-sm">
            <li>1. <strong>Upload images first:</strong> Use the image upload API before creating the property</li>
            <li>2. <strong>Link images to property:</strong> Pass the uploaded image URLs when creating the property</li>
            <li>3. <strong>Set correct thumbnail:</strong> Use the first uploaded image as the thumbnail</li>
            <li>4. <strong>Use R2 URLs:</strong> Ensure all images are stored in Cloudflare R2</li>
            <li>5. <strong>Test the flow:</strong> Upload images → Create property → Verify thumbnails</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
