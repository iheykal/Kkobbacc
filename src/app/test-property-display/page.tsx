'use client'

import { useState, useEffect } from 'react'
import { getPrimaryImageUrl, getAllImageUrls, getAdditionalImageUrls } from '@/lib/imageUrlResolver'

export default function TestPropertyDisplay() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties')
        const data = await response.json()
        
        if (data.success) {
          setProperties(data.data)
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Property Display Test</h1>
      
      {properties.map((property, index) => {
        const primaryImage = getPrimaryImageUrl(property)
        const allImages = getAllImageUrls(property)
        const additionalImages = getAdditionalImageUrls(property)
        
        console.log(`Property ${index + 1}:`, {
          title: property.title,
          thumbnailImage: property.thumbnailImage,
          images: property.images,
          primaryImage,
          allImages,
          additionalImages
        })
        
        return (
          <div key={property._id} className="border rounded-lg p-6 mb-8 bg-white shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{property.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Data Analysis */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Raw Database Data:</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Thumbnail:</strong> {property.thumbnailImage ? 'YES' : 'NO'}</p>
                    <p><strong>Images Array:</strong> {property.images?.length || 0} images</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Processed URLs:</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Primary Image:</strong> {primaryImage ? 'Found' : 'None'}</p>
                    <p><strong>All Images:</strong> {allImages.length}</p>
                    <p><strong>Additional Images:</strong> {additionalImages.length}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">URLs:</h3>
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                    <div>
                      <strong>Thumbnail URL:</strong>
                      <p className="break-all text-blue-600">{property.thumbnailImage}</p>
                    </div>
                    
                    {additionalImages.map((url, idx) => (
                      <div key={idx}>
                        <strong>Additional {idx + 1}:</strong>
                        <p className="break-all text-green-600">{url}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right: Visual Display */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Primary Image Display:</h3>
                  {primaryImage && (
                    <img 
                      src={primaryImage} 
                      alt="Primary" 
                      className="w-full h-48 object-cover rounded border"
                    />
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Additional Images Gallery:</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {additionalImages.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url} 
                        alt={`Additional ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded border"
                      />
                    ))}
                  </div>
                  {additionalImages.length === 0 && (
                    <p className="text-gray-500 text-sm">No additional images</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

