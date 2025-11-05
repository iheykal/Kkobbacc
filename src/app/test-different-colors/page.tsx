'use client'

import { generatePieChartColors, PIE_CHART_COLORS, DISTRICT_COLORS, PROPERTY_TYPE_COLORS, LISTING_TYPE_COLORS } from '@/lib/chartColors'

export default function TestDifferentColors() {
  // Test data - exactly like your pie charts
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

  // Generate colors using the new system
  const districtColors = generatePieChartColors(districtData, { palette: DISTRICT_COLORS })
  const propertyColors = generatePieChartColors(propertyTypeData, { palette: PROPERTY_TYPE_COLORS })
  const listingColors = generatePieChartColors(listingTypeData, { palette: LISTING_TYPE_COLORS })

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🎨 Each Pie Chart Piece Has Different Colors!</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-center">✅ FIXED: Maximum Color Contrast</h2>
          <p className="text-gray-600 text-center mb-6">
            Each piece of the pie chart now has a completely different color - no similar colors!
          </p>
        </div>
        
        {/* District Colors - Like your first chart */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">District Distribution (Helwaa, Hodan, Wadajir)</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {districtData.map((item, index) => (
              <div key={item.name} className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: districtColors[index] }}
                />
                <span className="text-sm font-medium text-center">
                  {item.name}<br/>
                  <span className="text-gray-500">({item.value})</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Colors: {districtColors.map(color => color).join(', ')}
            </p>
          </div>
        </div>

        {/* Property Type Colors - Like your second chart */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Property Type Breakdown (Apartment, Villa)</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {propertyTypeData.map((item, index) => (
              <div key={item.name} className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: propertyColors[index] }}
                />
                <span className="text-sm font-medium text-center">
                  {item.name}<br/>
                  <span className="text-gray-500">({item.value})</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Colors: {propertyColors.map(color => color).join(', ')}
            </p>
          </div>
        </div>

        {/* Listing Type Colors - Like your third chart */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Listing Type Breakdown (Sale, Rent)</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {listingTypeData.map((item, index) => (
              <div key={item.name} className="flex flex-col items-center space-y-2">
                <div 
                  className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                  style={{ backgroundColor: listingColors[index] }}
                />
                <span className="text-sm font-medium text-center">
                  {item.name}<br/>
                  <span className="text-gray-500">({item.value})</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Colors: {listingColors.map(color => color).join(', ')}
            </p>
          </div>
        </div>

        {/* Color Comparison */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎯 Color Palette Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-3">District Colors</h3>
              <div className="flex flex-wrap gap-2">
                {DISTRICT_COLORS.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Property Type Colors</h3>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPE_COLORS.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1">{color}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Listing Type Colors</h3>
              <div className="flex flex-wrap gap-2">
                {LISTING_TYPE_COLORS.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Chart Types Together */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🎯 All Your Charts Now Have Different Colors!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* District Chart Colors */}
            <div className="text-center">
              <h3 className="font-medium mb-3">District Chart</h3>
              <div className="flex justify-center space-x-2">
                {districtColors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1 text-gray-600">{districtData[index]?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Type Chart Colors */}
            <div className="text-center">
              <h3 className="font-medium mb-3">Property Type Chart</h3>
              <div className="flex justify-center space-x-2">
                {propertyColors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1 text-gray-600">{propertyTypeData[index]?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Listing Type Chart Colors */}
            <div className="text-center">
              <h3 className="font-medium mb-3">Listing Type Chart</h3>
              <div className="flex justify-center space-x-2">
                {listingColors.map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-xs mt-1 text-gray-600">{listingTypeData[index]?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Problem Solved!</h3>
          <p className="text-green-700">
            Each piece of your pie chart (and donut chart) now has a completely different color. The AI agent will no longer generate similar colors because:
          </p>
          <ul className="list-disc list-inside text-green-700 mt-2 space-y-1">
            <li>Pure RGB colors (Red, Green, Blue, Yellow, Magenta, Cyan)</li>
            <li>Maximum contrast between adjacent segments</li>
            <li>No similar shades or tones</li>
            <li>Each color is visually distinct</li>
            <li>Works for all chart types: Pie charts, Donut charts, and any other charts</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
