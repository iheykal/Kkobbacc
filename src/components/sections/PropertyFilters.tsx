'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Filter, X, MapPin, Home, Building, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'

export interface FilterOptions {
  listingType: 'all' | 'sale' | 'rent'
  district: string
}

interface PropertyFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableDistricts: string[]
  className?: string
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFiltersChange,
  availableDistricts,
  className
}) => {
  const [showGuidance, setShowGuidance] = React.useState(false)
  const { isAuthenticated, user } = useUser()

  // Smart guidance system for different user types
  React.useEffect(() => {
    const checkGuidanceStatus = () => {
      if (!user) {
        // Anonymous visitors: show after 5+ visits
        const visitCountKey = 'anonymous_visitor_visit_count'
        const visitCount = parseInt(localStorage.getItem(visitCountKey) || '0')
        const newVisitCount = visitCount + 1
        
        localStorage.setItem(visitCountKey, newVisitCount.toString())
        
        if (newVisitCount % 5 === 0) {
          setShowGuidance(true)
        }
        return
      }

      // For authenticated users (agents)
      const agentId = user.id || (user as any)._id
      const agentGuidanceKey = `agent_guidance_${agentId}`
      const agentFirstVisitKey = `agent_first_visit_${agentId}`
      const agentSecondVisitKey = `agent_second_visit_${agentId}`
      
      const hasSeenFirstGuidance = localStorage.getItem(agentFirstVisitKey)
      const hasSeenSecondGuidance = localStorage.getItem(agentSecondVisitKey)
      const lastGuidanceTime = localStorage.getItem(agentGuidanceKey)
      
      const now = new Date().getTime()
      const twelveHoursInMs = 12 * 60 * 60 * 1000 // 12 hours in milliseconds
      
      if (!hasSeenFirstGuidance) {
        // First visit for this agent - show guidance
        setShowGuidance(true)
        localStorage.setItem(agentFirstVisitKey, 'true')
        localStorage.setItem(agentGuidanceKey, now.toString())
      } else if (!hasSeenSecondGuidance && lastGuidanceTime) {
        // Check if 12 hours have passed since first guidance
        const timeSinceLastGuidance = now - parseInt(lastGuidanceTime)
        
        if (timeSinceLastGuidance >= twelveHoursInMs) {
          // 12 hours have passed - show second guidance
          setShowGuidance(true)
          localStorage.setItem(agentSecondVisitKey, 'true')
          localStorage.setItem(agentGuidanceKey, now.toString())
        }
      }
      // If both first and second guidance have been shown, never show again
    }

    checkGuidanceStatus()
  }, [isAuthenticated, user])

  // Hide guidance after 8 seconds
  React.useEffect(() => {
    if (showGuidance) {
      const timer = setTimeout(() => {
        setShowGuidance(false)
      }, 8000)
      
      return () => clearTimeout(timer)
    }
  }, [showGuidance])

  // Hide guidance when user interacts with the dropdown
  const handleDistrictDropdownClick = () => {
    if (showGuidance) {
      setShowGuidance(false)
    }
  }

  const handleDistrictChange = (district: string) => {
    // Hide guidance when user selects a district
    if (showGuidance) {
      setShowGuidance(false)
    }
    
    onFiltersChange({
      ...filters,
      district: district
    })
  }

  const listingTypeOptions = [
    { value: 'all', label: 'All Types', icon: Home },
    { value: 'sale', label: 'iib', icon: Building },
    { value: 'rent', label: 'Kiro', icon: Home }
  ]

  const handleListingTypeChange = (type: 'all' | 'sale' | 'rent') => {
    onFiltersChange({
      ...filters,
      listingType: type
    })
  }

  const hasActiveFilters = filters.listingType !== 'all' || filters.district !== ''

  const clearFilters = () => {
    onFiltersChange({
      listingType: 'all',
      district: ''
    })
  }

  // Determine if we should show guidance
  const shouldShowGuidance = showGuidance && (
    (!isAuthenticated && !user) || // Anonymous visitors
    (isAuthenticated && user) // Authenticated agents
  )

  return (
    <div className={cn("bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Filter Properties</h3>
        </div>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Listing Type Filter */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Listing Type</h4>
          <div className="flex space-x-2">
            {listingTypeOptions.map((option) => {
              const Icon = option.icon
              const isActive = filters.listingType === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => handleListingTypeChange(option.value as 'all' | 'sale' | 'rent')}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all duration-200",
                    isActive
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* District Filter */}
        <div>
          <h4 className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
            <span className="text-lg">📍</span>
            Dooro degmada aad rabto
            <span className="text-lg">✨</span>
          </h4>
          <div className="relative group">
            {/* Enhanced MapPin Icon with hover effect */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="p-1 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors duration-200"
              >
                <MapPin className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
              </motion.div>
            </div>
            
            {/* Custom Chevron Icon */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
            </div>
            
            <div className="relative">
              <select
                value={filters.district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                onClick={handleDistrictDropdownClick}
                onFocus={handleDistrictDropdownClick}
                className="w-full pl-12 pr-10 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 font-medium shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer appearance-none"
                style={{
                  backgroundImage: 'none'
                }}
              >
                <option value="" className="py-2 text-slate-700 font-medium">
                  Dhammaan Degmooyin-ka
                </option>
                {availableDistricts.map((district) => (
                  <option 
                    key={district} 
                    value={district}
                    className="py-2 text-slate-700 font-medium hover:bg-blue-50"
                  >
                    {district}
                  </option>
                ))}
              </select>
              
              {/* Subtle gradient overlay for extra visual appeal */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-transparent to-blue-50/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Animated Hand Clicking on "Dhammaan Degmooyin-ka" */}
              {shouldShowGuidance && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none z-20"
                >
                  <motion.div
                    animate={{
                      x: [0, 3, 0],
                      y: [0, -1, 0],
                      scale: [1, 0.95, 1],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 2.5,
                    }}
                  >
                    <motion.div
                      className="text-xl"
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 1.5,
                      }}
                    >
                      👆
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-2 rounded-full whitespace-nowrap shadow-lg"
                      animate={{
                        opacity: [0, 1, 0],
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 0.8,
                      }}
                    >
                      Halkaan ka fiiri degmada aad karabto
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {filters.listingType !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {listingTypeOptions.find(opt => opt.value === filters.listingType)?.label}
                <button
                  onClick={() => handleListingTypeChange('all')}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.district && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {filters.district}
                <button
                  onClick={() => handleDistrictChange('')}
                  className="ml-2 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}