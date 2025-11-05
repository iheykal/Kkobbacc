'use client'

import { useState, useEffect } from 'react'
import { Eye, TrendingUp, BarChart3, MapPin } from 'lucide-react'

interface PropertyViewData {
  propertyId: number
  title: string
  location: string
  district: string
  price: number
  viewCount: number
  propertyType: string
  listingType?: string
}

interface PropertyViewStats {
  summary: {
    totalViews: number
    totalProperties: number
    avgViews: number
    propertiesWithNoViews: number
  }
  mostViewedProperties: PropertyViewData[]
}

export default function PropertyViewStats() {
  const [data, setData] = useState<PropertyViewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    console.log('PropertyViewStats: Component mounted')
    setDebugInfo('Component mounted, testing connectivity...')
    // Test connectivity first
    testConnectivity()
  }, [])

  const testConnectivity = async () => {
    try {
      console.log('PropertyViewStats: Testing connectivity...')
      setDebugInfo('Testing connectivity to property view stats API...')
      
      // Test with a simple fetch to the actual endpoint
      const response = await fetch('/api/admin/property-view-stats', {
        credentials: 'include'
      })
      
      console.log('PropertyViewStats: Connectivity test response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('PropertyViewStats: Connectivity test result:', data)
        
        if (data.success) {
          console.log('PropertyViewStats: Connectivity test passed, data received successfully')
          setData(data.data)
          setLoading(false)
        } else {
          const errorMsg = 'API returned error: ' + (data.error || 'Unknown error')
          setDebugInfo(errorMsg)
          setError(errorMsg)
        }
      } else {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`
        setDebugInfo(errorMsg)
        setError(errorMsg)
      }
    } catch (error) {
      console.error('PropertyViewStats: Connectivity test failed:', error)
      const errorMsg = 'Connectivity test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      setDebugInfo(errorMsg)
      setError(errorMsg)
    }
  }

  const fetchPropertyViewStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('PropertyViewStats: Starting fetch request...')
      const response = await fetch('/api/admin/property-view-stats', {
        credentials: 'include'
      })

      console.log('PropertyViewStats: Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('PropertyViewStats: Error response data:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch property view statistics`)
      }

      const result = await response.json()
      console.log('PropertyViewStats: Response data:', result)
      
      if (result.success) {
        setData(result.data)
      } else {
        console.error('PropertyViewStats: API returned success: false', result)
        setError(result.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching property view stats:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load property view statistics'
      console.error('PropertyViewStats error details:', {
        error: error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, listingType?: string) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    
    // Add "/Bishii" (monthly in Somali) for rent properties
    if (listingType === 'rent') {
      return `${formattedPrice}<span class="text-xs font-light text-gray-500 italic">/Bishii</span>`
    }
    
    return formattedPrice
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property view statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="text-center h-64 flex items-center justify-center">
          <div>
            <p className="text-red-600 mb-2 font-semibold">Error loading property view statistics</p>
            <p className="text-red-500 mb-2 text-sm">{error}</p>
            {debugInfo && (
              <p className="text-gray-600 mb-4 text-xs italic">{debugInfo}</p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  setDebugInfo('Retrying connection...')
                  testConnectivity()
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors mr-2"
              >
                Test Connection
              </button>
              <button
                onClick={() => {
                  setLoading(true)
                  setError(null)
                  setDebugInfo('Retrying fetch...')
                  fetchPropertyViewStats()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Fetch
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="text-center h-64 flex items-center justify-center">
          <p className="text-gray-600">No property view data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Property View Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-600">Total Views</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.totalViews.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold text-green-600">{data.summary.totalProperties}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">Avg Views</p>
            <p className="text-2xl font-bold text-purple-600">{data.summary.avgViews}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">No Views</p>
            <p className="text-2xl font-bold text-orange-600">{data.summary.propertiesWithNoViews}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Most Viewed Properties</h4>
        <div className="space-y-3">
          {data.mostViewedProperties.slice(0, 5).map((property, index) => (
            <div key={property.propertyId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h5 className="font-semibold text-gray-800 truncate max-w-xs">
                      {property.title}
                    </h5>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      ID: {property.propertyId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{property.district}</span>
                    </div>
                    <span 
                      className="text-green-600 font-semibold"
                      dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
                    />
                    <span className="text-purple-600">
                      {property.propertyType}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-right">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700">{property.viewCount}</span>
                <span className="text-sm text-gray-500">views</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.summary.propertiesWithNoViews > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-semibold">
              {data.summary.propertiesWithNoViews} properties have no views yet
            </span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Consider promoting these properties to increase visibility
          </p>
        </div>
      )}
    </div>
  )
}
