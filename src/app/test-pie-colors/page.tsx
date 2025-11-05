'use client'

import { generatePieChartColors, PIE_CHART_COLORS, DISTRICT_COLORS, PROPERTY_TYPE_COLORS, LISTING_TYPE_COLORS } from '@/lib/chartColors'

export default function TestPieColors() {
  // Test data
  const districtData = [
    { name: 'Helwaa', value: 2 },
    { name: 'Hodan', value: 1 },
    { name: 'Wadajir', value: 1 }
  ]

  const propertyTypeData = [
    { name: 'Apartment', value: 2 },
    { name: 'Villa', value: 2 }
  ]

  const listingTypeData = [
    { name: 'Sale', value: 3 },
    { name: 'Rent', value: 1 }
  ]

  // Generate colors
  const districtColors = generatePieChartColors(districtData, { palette: DISTRICT_COLORS })
  const propertyColors = generatePieChartColors(propertyTypeData, { palette: PROPERTY_TYPE_COLORS })
  const listingColors = generatePieChartColors(listingTypeData, { palette: LISTING_TYPE_COLORS })

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pie Chart Color Test</h1>
        
        {/* District Colors */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">District Colors</h2>
          <div className="flex flex-wrap gap-4">
            {districtData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: districtColors[index] }}
                />
                <span className="text-sm font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property Type Colors */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Property Type Colors</h2>
          <div className="flex flex-wrap gap-4">
            {propertyTypeData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: propertyColors[index] }}
                />
                <span className="text-sm font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Listing Type Colors */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Listing Type Colors</h2>
          <div className="flex flex-wrap gap-4">
            {listingTypeData.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: listingColors[index] }}
                />
                <span className="text-sm font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Color Palette Preview */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Available Color Palettes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-medium mb-2">Main Palette</h3>
              <div className="flex flex-wrap gap-1">
                {PIE_CHART_COLORS.slice(0, 10).map((color, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">District Colors</h3>
              <div className="flex flex-wrap gap-1">
                {DISTRICT_COLORS.map((color, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Property Type Colors</h3>
              <div className="flex flex-wrap gap-1">
                {PROPERTY_TYPE_COLORS.map((color, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Listing Type Colors</h3>
              <div className="flex flex-wrap gap-1">
                {LISTING_TYPE_COLORS.map((color, index) => (
                  <div 
                    key={index}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
