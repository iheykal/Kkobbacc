'use client'

import React, { useState, useEffect } from 'react'
import { getPrimaryImageUrl, getAllImageUrls, isR2Url, isLocalUploadUrl } from '@/lib/imageUrlResolver'

export default function TestR2Images() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      const data = await response.json()
      
      if (data.success && data.properties) {
        setProperties(data.properties.slice(0, 5)) // Test with first 5 properties
        testImageUrls(data.properties.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const testImageUrls = (props: any[]) => {
    const results = props.map(property => {
      const primaryUrl = getPrimaryImageUrl(property)
      const allUrls = getAllImageUrls(property)
      
      return {
        propertyId: property.propertyId || property._id,
        title: property.title,
        originalThumbnail: property.thumbnailImage,
        originalImages: property.images,
        resolvedPrimary: primaryUrl,
        resolvedAll: allUrls,
        isR2Primary: primaryUrl ? isR2Url(primaryUrl) : false,
        isLocalPrimary: primaryUrl ? isLocalUploadUrl(primaryUrl) : false,
        r2Count: allUrls.filter(isR2Url).length,
        localCount: allUrls.filter(isLocalUploadUrl).length,
        totalImages: allUrls.length
      }
    })
    
    setTestResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          R2 Image Migration Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Migration Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Properties</h3>
              <p className="text-2xl font-bold text-blue-600">{testResults.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">R2 Images</h3>
              <p className="text-2xl font-bold text-green-600">
                {testResults.reduce((sum, r) => sum + r.r2Count, 0)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900">Local Images</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {testResults.reduce((sum, r) => sum + r.localCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {testResults.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {result.propertyId}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.isR2Primary 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.isR2Primary ? 'R2 Primary' : 'Local Primary'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Image Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Images:</span>
                      <span className="font-medium">{result.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R2 Images:</span>
                      <span className="font-medium text-green-600">{result.r2Count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Local Images:</span>
                      <span className="font-medium text-yellow-600">{result.localCount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Primary Image</h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Resolved URL:</span>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs break-all">
                        {result.resolvedPrimary}
                      </div>
                    </div>
                    {result.resolvedPrimary && (
                      <div className="mt-2">
                        <img 
                          src={result.resolvedPrimary} 
                          alt="Primary image"
                          className="w-32 h-24 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.border = '2px solid red'
                            e.currentTarget.alt = 'Failed to load'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {result.resolvedAll.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">All Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.resolvedAll.map((url: string, imgIndex: number) => (
                      <div key={imgIndex} className="relative">
                        <img 
                          src={url} 
                          alt={`Image ${imgIndex + 1}`}
                          className="w-full h-20 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.style.border = '2px solid red'
                            e.currentTarget.alt = 'Failed to load'
                          }}
                        />
                        <div className={`absolute top-1 right-1 px-1 py-0.5 rounded text-xs ${
                          isR2Url(url) 
                            ? 'bg-green-500 text-white' 
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {isR2Url(url) ? 'R2' : 'Local'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Migration Status
          </h3>
          <p className="text-blue-800">
            This test shows how images are being resolved after the R2 migration. 
            Green indicators show images served from Cloudflare R2, while yellow 
            indicators show local images that may need to be migrated.
          </p>
        </div>
      </div>
    </div>
  )
}
