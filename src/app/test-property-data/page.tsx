'use client'

import { useState, useEffect } from 'react'
import { useProperties } from '@/hooks/useProperties'

export default function TestPropertyDataPage() {
  const { properties, loading, error } = useProperties()
  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  useEffect(() => {
    if (properties.length > 0) {
      console.log('🔍 All properties loaded:', properties)
      console.log('🔍 First property structure:', {
        property: properties[0],
        propertyId: properties[0]?.propertyId,
        _id: properties[0]?._id,
        status: properties[0]?.status,
        title: properties[0]?.title,
        availableKeys: Object.keys(properties[0] || {})
      })
    }
  }, [properties])

  const testNavigation = (property: any) => {
    console.log('🔍 Testing navigation for property:', {
      property,
      propertyId: property.propertyId,
      _id: property._id,
      status: property.status,
      title: property.title
    })

    const propertyId = property.propertyId || property._id
    if (!propertyId) {
      console.error('❌ No property ID found!')
      alert('No property ID found!')
      return
    }

    const propertyType = property.status === 'For Rent' ? 'kiro' : 'iib'
    const targetUrl = `/${propertyType}/${propertyId}`
    
    console.log('✅ Would navigate to:', targetUrl)
    alert(`Would navigate to: ${targetUrl}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Properties</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Data Test</h1>
            <p className="text-gray-600">Testing property data structure and navigation</p>
          </div>

          {/* Property Count */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Property Data Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-md border">
                <div className="font-semibold text-gray-900">Total Properties</div>
                <div className="text-2xl font-bold text-blue-600">{properties.length}</div>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <div className="font-semibold text-gray-900">Properties with propertyId</div>
                <div className="text-2xl font-bold text-green-600">
                  {properties.filter(p => p.propertyId).length}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md border">
                <div className="font-semibold text-gray-900">Properties with _id only</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {properties.filter(p => !p.propertyId && p._id).length}
                </div>
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties List</h2>
            <div className="space-y-4">
              {properties.slice(0, 10).map((property, index) => (
                <div key={property._id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Status: <span className="font-medium">{property.status}</span></div>
                        <div>Property ID: <span className="font-medium">{property.propertyId || 'N/A'}</span></div>
                        <div>MongoDB ID: <span className="font-medium">{property._id || 'N/A'}</span></div>
                        <div>Location: <span className="font-medium">{property.location}</span></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => testNavigation(property)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Test Navigation
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Console Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Console Check Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Open browser Developer Tools (F12)</li>
              <li>Go to the Console tab</li>
              <li>Look for property data logs (🔍 symbols)</li>
              <li>Click "Test Navigation" buttons to see navigation logs</li>
              <li>Check for any errors or missing property IDs</li>
            </ol>
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => window.history.back()}
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
