'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PropertyImageWithWatermark } from '@/components/ui/PropertyImageWithWatermark'

interface Property {
  _id: string
  propertyId: number
  title: string
  thumbnailImage?: string
  images: string[]
  price: number
  location: string
}

export default function TestLogoDisplayPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties?limit=5')
      const data = await response.json()
      
      if (data.success) {
        setProperties(data.data)
      } else {
        setError(data.error || 'Failed to fetch properties')
      }
    } catch (error) {
      setError('Error fetching properties')
    } finally {
      setLoading(false)
    }
  }

  const getPropertyImage = (property: Property) => {
    return property.thumbnailImage || property.images?.[0] || 'https://picsum.photos/400/300?random=1'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={fetchProperties}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Company Logo Display Test
            </h1>
            <p className="text-gray-600">
              Testing if the Kobac company logo appears correctly in property listings
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Test Information:</h2>
                         <ul className="text-blue-700 space-y-1">
               <li>• Company logo URL: <code>/icons/uze.png</code></li>
               <li>• Logo appears as a transparent watermark overlay on all property images</li>
               <li>• Total properties loaded: {properties.length}</li>
             </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {properties.map((property, index) => {
               const displayImage = getPropertyImage(property);
              
              return (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden border"
                >
                  {/* Property Image */}
                  <div className="relative h-48 overflow-hidden">
                                         <PropertyImageWithWatermark
                       src={displayImage}
                       alt={property.title}
                       className="w-full h-full"
                       showWatermark={true}
                       watermarkPosition="center"
                       watermarkSize="medium"
                     />
                    
                                         {/* Watermark Indicator */}
                     <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                       ✅ Watermark Active
                     </div>
                     
                     {/* Image Source Indicator */}
                     <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                       📸 Photo + 🏢 Logo
                     </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                    <p className="text-green-600 font-bold">${property.price.toLocaleString()}</p>
                    
                                         {/* Debug Info */}
                     <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                       <div><strong>Property ID:</strong> {property.propertyId}</div>
                       <div><strong>Total Images:</strong> {property.images?.length || 0}</div>
                       <div><strong>Watermark:</strong> Uze Logo</div>
                       <div><strong>Display Image:</strong> {displayImage}</div>
                     </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={fetchProperties}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Refresh Properties
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
