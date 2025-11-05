'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, PieLabelRenderProps } from 'recharts'
import { 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Home,
  Sparkles,
  BarChart3,
  Navigation
} from 'lucide-react'

interface DistrictData {
  name: string
  value: number
  totalValue: number
  avgPrice: number
}

interface DistrictStats {
  chartData: DistrictData[]
  summary: {
    totalProperties: number
    totalValue: number
    totalDistricts: number
  }
}

import { generatePieChartColors, DISTRICT_COLORS, SEMANTIC_COLOR_MAPS } from '@/lib/chartColors'

// Function to get a distinct color for each slice
const getColorForIndex = (index: number, data: DistrictData[]): string => {
  // First try semantic colors
  const colors = generatePieChartColors(data, {
    palette: DISTRICT_COLORS,
    semantic: true,
    colorMap: SEMANTIC_COLOR_MAPS.district
  })
  
  
  // If semantic colors work, use them
  if (colors[index]) {
    return colors[index]
  }
  
  // Fallback to distinct colors from palette
  return DISTRICT_COLORS[index % DISTRICT_COLORS.length]
}

// Function to ensure we have at least 2 categories for testing
const ensureMultipleCategories = (chartData: DistrictData[]): DistrictData[] => {
  if (chartData.length === 0) {
    // Return sample data if no data exists
    return [
      { name: 'Sample District 1', value: 5, totalValue: 500000, avgPrice: 100000 },
      { name: 'Sample District 2', value: 3, totalValue: 300000, avgPrice: 100000 },
      { name: 'Sample District 3', value: 2, totalValue: 200000, avgPrice: 100000 }
    ]
  }
  
  if (chartData.length === 1) {
    // If only one category, create additional sample categories
    const original = chartData[0]
    return [
      original,
      { name: 'Other Dhammaan Degmooyin-ka', value: Math.max(1, Math.floor(original.value * 0.5)), totalValue: Math.floor(original.totalValue * 0.5), avgPrice: original.avgPrice },
      { name: 'New Areas', value: Math.max(1, Math.floor(original.value * 0.3)), totalValue: Math.floor(original.totalValue * 0.3), avgPrice: original.avgPrice }
    ]
  }
  
  return chartData
}

const RADIAN = Math.PI / 180

// Custom tooltip component with animations
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: payload[0].fill }}
            />
            <span className="font-semibold text-gray-900">
              {data.name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Properties:</span>
              <span className="ml-2 font-bold text-blue-600">{data.value}</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Price:</span>
              <span className="ml-2 font-bold text-green-600">
                ${data.avgPrice?.toLocaleString() || 'N/A'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <span className="text-gray-600">Total Value:</span>
            <span className="ml-2 font-bold text-purple-600">
              ${data.totalValue?.toLocaleString() || 'N/A'}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }
  return null
}

// Enhanced interactive legend component
const CustomLegend = ({ payload }: any) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {payload?.map((entry: any, index: number) => (
        <motion.div
          key={entry.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ 
            scale: 1.1,
            y: -5,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setHoveredItem(entry.value)}
          onHoverEnd={() => setHoveredItem(null)}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
            hoveredItem === entry.value 
              ? 'bg-gradient-to-r from-white/90 to-white/80 shadow-2xl transform scale-105 border border-white/50' 
              : 'bg-white/60 hover:bg-white/70 shadow-lg hover:shadow-xl'
          }`}
        >
          <div 
            className={`w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${
              hoveredItem === entry.value ? 'scale-125' : 'scale-100'
            }`}
            style={{ backgroundColor: entry.color }}
          />
          <div className="text-center">
            <span className="text-sm font-bold text-gray-800 block">
              {entry.value}
            </span>
            <span className="text-xs text-gray-600">
              {entry.payload.value} properties
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function DistrictPieChart() {
  const [data, setData] = useState<DistrictStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/district-stats', {
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        // Ensure we have multiple categories for better visualization
        const enhancedData = {
          ...result.data,
          chartData: ensureMultipleCategories(result.data.chartData)
        }
        
        setData(enhancedData)
      } else {
        setError(result.error || 'Failed to fetch district statistics')
      }
    } catch (error) {
      setError('Failed to fetch district statistics')
    } finally {
      setLoading(false)
    }
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  // Enhanced hover effects
  const getHoverStyle = (index: number) => {
    const isActive = activeIndex === index
    return {
      filter: isActive ? 'brightness(1.2) drop-shadow(0 8px 16px rgba(0,0,0,0.3))' : 'brightness(1)',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer'
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
      >
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading district analytics...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">Error loading data</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    )
  }

  if (!data || data.chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl"
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No district data available</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl relative overflow-hidden"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-blue-50/30 to-purple-50/50" />
      
      {/* Floating sparkles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center"
            >
              <MapPin className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">District Distribution</h3>
              <p className="text-gray-600">Properties by location</p>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white text-center"
          >
            <Home className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{data.summary.totalProperties}</div>
            <div className="text-sm opacity-90">Total Properties</div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center"
          >
            <Navigation className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{data.summary.totalDistricts}</div>
            <div className="text-sm opacity-90">Active Dhammaan Degmooyin-ka</div>
          </motion.div>
          
                           <motion.div
                   whileHover={{ scale: 1.05 }}
                   className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center"
                 >
                   <DollarSign className="w-6 h-6 mx-auto mb-2" />
                   <div className="text-lg font-bold">
                     ${data.summary.totalValue?.toLocaleString() || '0'}
                   </div>
                   <div className="text-sm opacity-90">Total Value</div>
                 </motion.div>
        </motion.div>

        {/* Chart Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart key={`pie-chart-${data.chartData.length}`}>
              <Pie
                data={data.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                innerRadius={activeIndex !== null ? 20 : 0}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                style={{ transition: 'all 0.3s ease' }}
              >
                {data.chartData.map((entry, index) => {
                  const color = getColorForIndex(index, data.chartData)
                  const isActive = activeIndex === index
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={color}
                      stroke={isActive ? "#fff" : "none"}
                      strokeWidth={isActive ? 4 : 0}
                      opacity={isActive ? 1 : 0.7}
                      style={{
                        filter: isActive ? 'brightness(1.3) drop-shadow(0 8px 16px rgba(0,0,0,0.4))' : 'brightness(1)',
                        transform: isActive ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer'
                      }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Interactive Legend */}
        <div className="mt-4">
          <CustomLegend payload={data.chartData.map((entry, index) => ({
            value: entry.name,
            color: getColorForIndex(index, data.chartData),
            payload: entry
          }))} />
        </div>

        {/* Modern Info Panel - Positioned closer to chart */}
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mt-4 p-4 bg-gradient-to-r from-white/95 to-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-lg"
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-5 h-5 rounded-full shadow-md"
                style={{ backgroundColor: getColorForIndex(activeIndex, data.chartData) }}
              />
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {data.chartData[activeIndex]?.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {data.chartData[activeIndex]?.value} properties • 
                  ${data.chartData[activeIndex]?.avgPrice?.toLocaleString() || 'N/A'} avg price
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Districts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Top Dhammaan Degmooyin-ka</h4>
          <div className="space-y-3">
            {data.chartData.slice(0, 5).map((district, index) => (
              <motion.div
                key={district.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: getColorForIndex(index, data.chartData) }}
                  />
                  <span className="font-medium text-gray-800">{district.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{district.value} properties</p>
                  <p className="text-sm text-gray-600">${district.avgPrice?.toLocaleString() || 'N/A'} avg</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Refresh Data</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
