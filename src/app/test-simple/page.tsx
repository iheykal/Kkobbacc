'use client'

import { useState, useEffect } from 'react'

export default function TestSimplePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/test-db')
      const result = await response.json()
      
      if (result.success) {
        console.log('🔍 Database data:', result.data)
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Data Analysis</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Total Properties: {data?.totalProperties}</h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">District Distribution</h2>
          <div className="space-y-2">
            {data?.districtStats?.map((stat: any, index: number) => (
              <div key={stat._id} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{stat._id || 'Unknown'}</span>
                <span className="text-blue-600 font-bold">{stat.count}</span>
              </div>
            ))}
            {(!data?.districtStats || data.districtStats.length === 0) && (
              <p className="text-gray-500">No district data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Property Type Distribution</h2>
          <div className="space-y-2">
            {data?.propertyTypeStats?.map((stat: any, index: number) => (
              <div key={stat._id} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{stat._id || 'Unknown'}</span>
                <span className="text-green-600 font-bold">{stat.count}</span>
              </div>
            ))}
            {(!data?.propertyTypeStats || data.propertyTypeStats.length === 0) && (
              <p className="text-gray-500">No property type data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Listing Type Distribution</h2>
          <div className="space-y-2">
            {data?.listingTypeStats?.map((stat: any, index: number) => (
              <div key={stat._id} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{stat._id || 'Unknown'}</span>
                <span className="text-purple-600 font-bold">{stat.count}</span>
              </div>
            ))}
            {(!data?.listingTypeStats || data.listingTypeStats.length === 0) && (
              <p className="text-gray-500">No listing type data available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sample Properties</h2>
          <div className="space-y-2">
            {data?.sampleProperties?.map((prop: any, index: number) => (
              <div key={prop.id} className="p-3 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">District:</span> {prop.district || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Property Type:</span> {prop.propertyType || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Listing Type:</span> {prop.listingType || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {prop.status || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={fetchData}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Data
      </button>
    </div>
  )
}
