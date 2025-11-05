'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bed, Bath, MapPin, Heart, ArrowRight, Play, Calendar, Users, Grid, List, Award, Shield, Crown, RefreshCw, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PropertyImageWithWatermarkFixed } from '@/components/ui/PropertyImageWithWatermarkFixed'
import { cn, formatPrice, formatPhoneNumber, capitalizeName, DEFAULT_AVATAR_URL, getStableAvatarUrl, getPropertyUrl } from '@/lib/utils'
import { getFirstName } from '@/utils/nameUtils'
import { getPrimaryImageUrl } from '@/lib/imageUrlResolver'
import { useProperties, FilterOptions } from '@/hooks/useProperties'
import { propertyEventManager } from '@/lib/propertyEvents'
import { PropertyFilters } from './PropertyFilters'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'
import Link from 'next/link'
import NextImage from 'next/image'
import HybridImage from '@/components/ui/HybridImage'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

const sampleProperties = [
  {
    id: 1,
    title: "Luxury Villa in Beverly Hills",
    location: "Beverly Hills, CA",
    district: "Hamar‑Weyne",
    price: 8500000,
    beds: 6,
    baths: 7,
    sqft: 8500,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    featured: true,
    status: "For Sale",
    yearBuilt: 2020,
    lotSize: 15000,
    propertyType: "Villa",
    description: "This stunning luxury villa offers the perfect blend of modern architecture and timeless elegance. Located in the prestigious Beverly Hills area, this property features high-end finishes, smart home technology, and breathtaking city views. The open-concept living spaces flow seamlessly into the gourmet kitchen and outdoor entertainment areas.",
    features: [
      "Smart Home Technology",
      "Wine Cellar",
      "Home Theater",
      "Chef's Kitchen",
      "Custom Cabinetry",
      "Marble Countertops",
      "Hardwood Floors",
      "High Ceilings"
    ],
    amenities: [
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Garden",
      "Garage",
      "Fireplace"
    ],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    ],
    agent: {
      name: "Sarah Johnson",
      phone: "+1 (310) 555-0123",
      email: "sarah.johnson@luxuryestates.com",
      image: getStableAvatarUrl("agent-1", undefined, true),
      rating: 5,

    },
    agentId: "agent-1"
  },
  {
    id: 2,
    title: "Modern Penthouse with Ocean View",
    location: "Miami Beach, FL",
    district: "Hodan",
    price: 4200000,
    beds: 4,
    baths: 5,
    sqft: 6200,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80",
    featured: false,
    status: "For Rent",
    yearBuilt: 2022,
    lotSize: 0,
    propertyType: "Penthouse",
    description: "Experience luxury living at its finest in this stunning oceanfront penthouse. Floor-to-ceiling windows provide panoramic views of the Atlantic Ocean, while the contemporary design creates an atmosphere of sophisticated elegance. This exclusive property includes private elevator access and rooftop terrace.",
    features: [
      "Ocean Views",
      "Private Elevator",
      "Rooftop Terrace",
      "Floor-to-Ceiling Windows",
      "Gourmet Kitchen",
      "Master Suite",
      "Smart Home Features",
      "Concierge Service"
    ],
    amenities: [
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Garden",
      "Garage",
      "Elevator"
    ],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"
    ],
    agent: {
      name: "Michael Rodriguez",
      phone: "+1 (305) 555-0456",
      email: "michael.rodriguez@luxuryestates.com",
      image: getStableAvatarUrl("agent-2", undefined, true),
      rating: 5,

    },
    agentId: "agent-2"
  },
  {
    id: 3,
    title: "Elegant Estate in Greenwich",
    location: "Greenwich, CT",
    district: "Shangani",
    price: 12500000,
    beds: 8,
    baths: 10,
    sqft: 12000,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
    featured: true,
    status: "For Sale",
    yearBuilt: 2018,
    lotSize: 25000,
    propertyType: "Estate",
    description: "This magnificent estate represents the pinnacle of luxury living in Greenwich. Set on 2.5 acres of meticulously landscaped grounds, the property features a grand entrance, formal living and dining rooms, a gourmet kitchen, and multiple entertainment spaces. The estate includes a guest house and tennis court.",
    features: [
      "Grand Entrance",
      "Formal Living Room",
      "Gourmet Kitchen",
      "Guest House",
      "Tennis Court",
      "Landscaped Gardens",
      "Wine Cellar",
      "Home Office"
    ],
    amenities: [
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Garden",
      "Garage",
      "Fireplace"
    ],
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    ],
    agent: {
      name: "Elizabeth Thompson",
      phone: "+1 (203) 555-0789",
      email: "elizabeth.thompson@luxuryestates.com",
      image: getStableAvatarUrl("agent-3", undefined, true),
      rating: 5,

    },
    agentId: "agent-3"
  },
  {
    id: 4,
    title: "Contemporary Mansion in Aspen",
    location: "Aspen, CO",
    district: "Waberi",
    price: 6800000,
    beds: 5,
    baths: 6,
    sqft: 7800,
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    featured: false,
    status: "For Sale",
    yearBuilt: 2021,
    lotSize: 18000,
    propertyType: "Mansion",
    description: "Nestled in the heart of Aspen, this contemporary mansion offers the perfect blend of mountain luxury and modern design. The property features expansive windows that showcase the stunning mountain views, a gourmet kitchen with premium appliances, and multiple outdoor living spaces perfect for entertaining.",
    features: [
      "Mountain Views",
      "Gourmet Kitchen",
      "Outdoor Living Spaces",
      "Wine Room",
      "Home Theater",
      "Ski Storage",
      "Heated Driveway",
      "Smart Home System"
    ],
    amenities: [
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Garden",
      "Garage",
      "Fireplace"
    ],
    images: [
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    ],
    agent: {
      name: "David Chen",
      phone: "+1 (970) 555-0321",
      email: "david.chen@luxuryestates.com",
      image: DEFAULT_AVATAR_URL,
      rating: 5,

    },
    agentId: "agent-4"
  },
  {
    id: 5,
    title: "Luxury Condo in Manhattan",
    location: "Manhattan, NY",
    district: "Karan",
    price: 3200000,
    beds: 3,
    baths: 4,
    sqft: 4500,
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    featured: false,
    status: "For Sale",
    yearBuilt: 2023,
    lotSize: 0,
    propertyType: "Condo",
    description: "This sophisticated luxury condo in the heart of Manhattan offers the perfect urban lifestyle. The open floor plan maximizes space and natural light, while the premium finishes and appliances create an atmosphere of refined elegance. Building amenities include 24/7 concierge service and a rooftop terrace.",
    features: [
      "Open Floor Plan",
      "Premium Finishes",
      "High-End Appliances",
      "Floor-to-Ceiling Windows",
      "Custom Closets",
      "Smart Home Features",
      "Concierge Service",
      "Rooftop Access"
    ],
    amenities: [
      "WiFi",
      "Gym",
      "Security",
      "Garden",
      "Elevator"
    ],
    images: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"
    ],
    agent: {
      name: "Jennifer Martinez",
      phone: "+1 (212) 555-0987",
      email: "jennifer.martinez@luxuryestates.com",
      image: getStableAvatarUrl("agent-5", undefined, true),
      rating: 5,

    },
    agentId: "agent-5"
  },
  {
    id: 6,
    title: "Mediterranean Villa in Malibu",
    location: "Malibu, CA",
    district: "Shibis",
    price: 9500000,
    beds: 7,
    baths: 8,
    sqft: 9200,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
    featured: true,
    status: "For Sale",
    yearBuilt: 2019,
    lotSize: 20000,
    propertyType: "Villa",
    description: "This stunning Mediterranean villa in Malibu offers the perfect blend of European elegance and California lifestyle. The property features hand-carved stone details, custom ironwork, and expansive outdoor living spaces with ocean views. The gourmet kitchen and multiple entertainment areas make this the perfect home for hosting.",
    features: [
      "Ocean Views",
      "Hand-Carved Stone",
      "Custom Ironwork",
      "Gourmet Kitchen",
      "Outdoor Kitchen",
      "Wine Cellar",
      "Home Theater",
      "Guest Suite"
    ],
    amenities: [
      "WiFi",
      "Pool",
      "Gym",
      "Security",
      "Garden",
      "Garage",
      "Fireplace"
    ],
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    ],
    agent: {
      name: "Robert Wilson",
      phone: "+1 (310) 555-0654",
      email: "robert.wilson@luxuryestates.com",
      image: getStableAvatarUrl("agent-6", undefined, true),
      rating: 5,

    },
    agentId: "agent-6"
  }
]

export const SampleHomes: React.FC = () => {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const { setPreviousPage, preserveState, getPreservedState } = useNavigation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<FilterOptions>({
    listingType: 'all',
    district: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [clickedPropertyId, setClickedPropertyId] = useState<string | null>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  // Use scroll restoration hook for saving scroll position
  const { saveScrollPosition } = useScrollRestoration({
    key: 'home_page_state',
    enabled: true,
    delay: 100
  })
  
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }
  
  const { properties, loading, error } = useProperties(false, filters)
  
  // Get all properties (without filters) for calculating available districts
  const { properties: allProperties } = useProperties(false, undefined)

  // Preserve state when navigating back
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isNavigatingBack = sessionStorage.getItem('kobac_navigating_back')
      if (isNavigatingBack === 'true') {
        // Restore state if available
        const savedState = getPreservedState('sample_homes_state')
        if (savedState) {
          setViewMode(savedState.viewMode || 'grid')
          setFilters(savedState.filters || { listingType: 'all', district: '' })
        }
      }
    }
  }, [getPreservedState])

  // Save state before navigation
  useEffect(() => {
    preserveState('sample_homes_state', {
      viewMode,
      filters,
      timestamp: Date.now()
    })
  }, [viewMode, filters]) // Removed preserveState dependency to prevent unnecessary re-renders

  // Save scroll position when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Listen for property click events from recommendations
  useEffect(() => {
    const handleRecommendationClick = (event: CustomEvent) => {
      const property = event.detail
      handlePropertyClick(property)
    }

    window.addEventListener('propertyClick', handleRecommendationClick as EventListener)
    
    return () => {
      window.removeEventListener('propertyClick', handleRecommendationClick as EventListener)
    }
  }, [])

  const handlePropertyClick = (property: any) => {
    try {
      console.log('🔍 Property clicked:', {
        property: property,
        propertyId: property.propertyId,
        _id: property._id,
        status: property.status,
        title: property.title
      })

      // Store current page and scroll position for back navigation
      if (typeof window !== 'undefined') {
        setPreviousPage(window.location.pathname)
        
        // Save current scroll position with more detailed state
        const currentScrollPosition = window.scrollY
        preserveState('home_page_state', {
          timestamp: Date.now(),
          scrollPosition: currentScrollPosition,
          userAgent: navigator.userAgent,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        })
        
        // Also use the hook's save function for redundancy
        saveScrollPosition()
        
        console.log('🚀 SampleHomes: Saved scroll position', currentScrollPosition, 'for path', window.location.pathname)
        console.log('🚀 SampleHomes: Property clicked - navigating to detail page')
      }
      
      // Navigate to property detail page using client-side routing for faster loading
      const propertyId = property.propertyId || property._id
      if (!propertyId) {
        console.error('❌ Property ID not found:', {
          property,
          propertyId: property.propertyId,
          _id: property._id,
          availableKeys: Object.keys(property)
        })
        alert('Error: Property ID not found. Please try again.')
        return
      }
      
      // Use SEO-friendly URL format
      const targetUrl = getPropertyUrl(property)
      
      console.log('✅ Navigating to property:', { 
        propertyId, 
        targetUrl,
        propertyTitle: property.title 
      })
      
      // Navigate to individual property page
      router.push(targetUrl)
      
    } catch (error) {
      console.error('❌ Error navigating to property:', error)
      alert('Error navigating to property. Please try again.')
    }
  }


  // Separate properties by agent if user is logged in as an agent
  const isAgent = isAuthenticated && user?.role === 'agent'
  
  // Use database properties - don't fall back to sample data
  const displayProperties = properties
  
  // Separate properties into agent's own listings and others
  const { agentProperties, otherProperties } = useMemo(() => {
    if (!isAgent || !user?.id) {
      return { agentProperties: [], otherProperties: properties }
    }
    
    // More robust agentId matching - handle different formats
    const agentProps = properties.filter(property => {
      const propertyAgentId = property.agentId?.toString()
      const userId = user.id?.toString()
      
      // Debug logging for agentId matching
      if (property.title && (propertyAgentId || userId)) {
        console.log('🔍 AgentId matching debug:', {
          propertyTitle: property.title,
          propertyAgentId: propertyAgentId,
          userId: userId,
          matches: propertyAgentId === userId,
          propertyAgentIdType: typeof property.agentId,
          userIdType: typeof user.id
        })
      }
      
      return propertyAgentId === userId
    })
    
    const otherProps = properties.filter(property => {
      const propertyAgentId = property.agentId?.toString()
      const userId = user.id?.toString()
      return propertyAgentId !== userId
    })
    
    // Fallback: If no agent properties found by agentId, try to find by agent name/phone
    if (agentProps.length === 0 && properties.length > 0) {
      console.log('⚠️ No properties found by agentId, trying fallback matching...')
      
      const fallbackAgentProps = properties.filter(property => {
        // Try to match by agent name or phone if agentId doesn't match
        const agentName = property.agent?.name?.toLowerCase()
        const agentPhone = property.agent?.phone?.replace(/\D/g, '') // Remove non-digits
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const userPhone = user.phone?.replace(/\D/g, '') // Remove non-digits
        
        const nameMatch = agentName && userName && agentName.includes(userName) || userName.includes(agentName)
        const phoneMatch = agentPhone && userPhone && agentPhone === userPhone
        
        if (nameMatch || phoneMatch) {
          console.log('🔍 Fallback match found:', {
            propertyTitle: property.title,
            agentName: agentName,
            userName: userName,
            agentPhone: agentPhone,
            userPhone: userPhone,
            nameMatch,
            phoneMatch
          })
        }
        
        return nameMatch || phoneMatch
      })
      
          if (fallbackAgentProps.length > 0) {
      console.log('✅ Fallback matching successful, found properties:', fallbackAgentProps.length)
      return { 
        agentProperties: fallbackAgentProps, 
        otherProperties: properties.filter(p => !fallbackAgentProps.includes(p))
      }
    }
    
    // Final fallback: If still no properties found, show all properties as agent properties
    // This ensures agents can see their properties while we debug the matching issue
    if (agentProps.length === 0 && fallbackAgentProps.length === 0) {
      console.log('⚠️ No properties found by any matching method, showing all properties as agent properties')
      return { 
        agentProperties: properties, 
        otherProperties: []
      }
    }
    }
    
    console.log('🔍 Property separation results:', {
      totalProperties: properties.length,
      agentProperties: agentProps.length,
      otherProperties: otherProps.length,
      userId: user.id,
      sampleAgentProperty: agentProps[0] ? {
        title: agentProps[0].title,
        agentId: agentProps[0].agentId
      } : null,
      sampleOtherProperty: otherProps[0] ? {
        title: otherProps[0].title,
        agentId: otherProps[0].agentId
      } : null
    })
    
    return { agentProperties: agentProps, otherProperties: otherProps }
  }, [properties, isAgent, user?.id])
  
  // Extract available districts from all properties (not filtered)
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>()
    allProperties.forEach(property => {
      if (property.district) {
        districts.add(property.district)
      }
    })
    return Array.from(districts).sort()
  }, [allProperties])
  
  // Check if any filters are active
  const hasActiveFilters = filters.listingType !== 'all' || filters.district !== ''
  
  // Debug: Log what properties are being displayed
  console.log('🔍 SampleHomes Debug:', {
    databasePropertiesCount: properties.length,
    displayPropertiesCount: displayProperties.length,
    isAgent: isAgent,
    agentId: user?.id,
    agentPropertiesCount: agentProperties.length,
    otherPropertiesCount: otherProperties.length,
    loading: loading,
    error: error,
    availableDistricts: availableDistricts,
    filters: filters,
    firstProperty: displayProperties[0] ? {
      title: displayProperties[0].title,
      district: displayProperties[0].district,
      location: displayProperties[0].location,
      deletionStatus: displayProperties[0].deletionStatus,
      agentId: displayProperties[0].agentId,
      createdAt: displayProperties[0].createdAt
    } : null,
    sampleProperties: properties.slice(0, 3).map(p => ({ 
      title: p.title, 
      district: p.district,
      agentId: p.agentId,
      deletionStatus: p.deletionStatus 
    }))
  })

  // Helper function to get property key
  const getPropertyKey = (property: any, index: number) => {
    return property._id || property.propertyId || property.id || index
  }

  // Helper function to get property image using resolver
  const getPropertyImage = (property: any) => {
    const imageUrl = getPrimaryImageUrl(property);
    console.log('🖼️ Property image URL (R2):', {
      propertyId: property.propertyId || property._id,
      title: property.title,
      thumbnailImage: property.thumbnailImage,
      firstImage: property.images?.[0],
      fallbackImage: property.image,
      finalUrl: imageUrl
    });
    return imageUrl;
  }

  // Helper function to translate property status to Somali
  const translateStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'for sale':
      case 'for-sale':
        return 'For Sale'
      case 'for rent':
      case 'for-rent':
        return 'For Rent'
      case 'sold':
        return 'Sold'
      case 'rented':
        return 'Rented'
      default:
        return status || 'For Sale'
    }
  }

  // Grid View Card Component
  const GridCard = ({ property, index }: { property: any; index: number }) => {
    const isClicked = clickedPropertyId === (property.id || property._id || property.propertyId)
    
    return (
      <motion.div
        key={getPropertyKey(property, index)}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ 
          opacity: 1, 
          y: 0
        }}
        transition={{ 
          duration: 0.4, 
          delay: index * 0.02, // Reduced delay
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        viewport={{ once: true }}
        className="group relative"
      >
        {/* Loading Overlay */}
        {isClicked && isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                  scale: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-2"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white text-sm font-medium"
              >
                Opening...
              </motion.p>
            </div>
          </motion.div>
        )}
        
        {/* Click Effect Ripple */}
        {isClicked && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 bg-blue-400 rounded-full pointer-events-none z-5"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
        
        <div 
          className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          onClick={(e) => {
            console.log('🖱️ Property card clicked!', { propertyId: property.propertyId, title: property.title })
            e.preventDefault()
            e.stopPropagation()
            handlePropertyClick(property)
          }}
        >
        {/* Image Section */}
        <div className="relative h-40 sm:h-48 md:h-60 lg:h-80 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <PropertyImageWithWatermarkFixed
            src={getPropertyImage(property) || '/icons/placeholder.jpg'}
            alt={property.title}
            className="w-full h-full object-cover object-center"
            showWatermark={true}
            watermarkPosition="center"
            property={property}
            watermarkSize="small"
          />
          
          {/* Overlay Elements */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
              ID: {property.propertyId || property.id || 'N/A'}
            </div>
          </div>

          {/* Top Right Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {/* My Property Badge */}
            {isAgent && property.agentId === user?.id && (
              <div className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                My Property
              </div>
            )}
          </div>


        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-3 sm:mb-4 md:mb-6">
            <div className="mb-1 sm:mb-2 md:mb-3">
              <h3 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                {property.title}
              </h3>
            </div>
            <div className="flex items-center text-slate-600 mb-2 sm:mb-3 md:mb-4">
              <img 
                src="/icons/location.gif" 
                alt="Location" 
                className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2 flex-shrink-0 object-contain"
              />
              <span className="text-xs sm:text-sm md:text-base lg:text-lg line-clamp-1">{property.location}</span>
            </div>
            {property.district && (
              <div className="flex items-center text-slate-500 mb-2 sm:mb-3 md:mb-4">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2 text-green-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base lg:text-lg line-clamp-1 font-medium text-green-700">
                  {property.district}
                </span>
              </div>
            )}
            
            {/* Price Display */}
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div 
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600"
                dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
              />
            </div>
          </div>

          {/* Stats Grid - Show different fields based on property type */}
          <div className={`grid gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-5 md:mb-6 lg:mb-8 ${property.status === 'For Sale' ? 'grid-cols-2' : 'grid-cols-2'}`}>
            {/* For Sale properties: Show Sharciga and Cabbirka instead of QOL/Suuli */}
            {property.status === 'For Sale' ? (
              <>
                <div className="text-center group/stat">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                    <img 
                      src="/icons/sharci.gif" 
                      alt="Document" 
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain"
                    />
                  </div>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1">{property.documentType || 'Siyaad Barre'}</div>
                  <div className="text-blue-800 text-xs sm:text-sm font-medium">Sharciga</div>
                </div>
                
                <div className="text-center group/stat">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                    <img 
                      src="/icons/ruler.gif" 
                      alt="Measurement" 
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-12 lg:h-12 object-contain"
                    />
                  </div>
                  <div className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.measurement || 'N/A'}</div>
                  <div className="text-blue-800 text-xs sm:text-sm font-medium">Cabbirka</div>
                </div>
              </>
            ) : (
              /* For Rent properties: Show QOL and Suuli only if values > 0 */
              <>
                {property.beds > 0 && (
            <div className="text-center group/stat">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                <NextImage 
                  src="/icons/bed.png" 
                  alt="Bed" 
                  width={32}
                  height={32}
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 object-contain"
                  loading="lazy"
                />
              </div>
              <div className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.beds}</div>
                    <div className="text-blue-800 text-xs sm:text-sm font-medium">Qol</div>
            </div>
                )}
            
                {property.baths > 0 && (
            <div className="text-center group/stat">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                <video 
                  src="/icons/shower1.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 object-contain"
                />
              </div>
              <div className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.baths}</div>
                    <div className="text-blue-800 text-xs sm:text-sm font-medium">Suuli</div>
              </div>
                )}
              </>
            )}
          </div>

          {/* Agent Preview */}
          <div className="flex items-center p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <HybridImage
                src={getStableAvatarUrl(property.agentId || property.agent?.name || 'agent-1', property.agent?.image, false)}
                alt={capitalizeName(property.agent?.name || 'Agent')}
                width={48}
                height={48}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-900 text-xs sm:text-sm md:text-base truncate">
                    {getFirstName(property.agent?.name)}
                  </div>
                  {(property.agent?.name?.toLowerCase().includes('kobac real estate') || 
                    property.agent?.name?.toLowerCase().includes('kobac real')) && (
                    <div className="flex items-center justify-center w-4 h-4 rounded-full shadow-lg border-2 border-white" style={{backgroundColor: '#1877F2'}}>
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  <span 
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => {
                      if (property.agent?.phone) {
                        // Clean the phone number for tel: link and format with 061
                        const cleanPhone = property.agent.phone.replace(/\D/g, '');
                        const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                        const phoneLink = `tel:${formattedPhone}`;
                        window.location.href = phoneLink;
                      }
                    }}
                  >
                  {property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Contact Agent'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
      )
    }

  // List View Card Component
  const ListCard = ({ property, index }: { property: any; index: number }) => (
    <motion.div
      key={getPropertyKey(property, index)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.02, // Reduced delay
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once: true }}
      className="group"
    >
      <div 
        className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={(e) => {
          console.log('🖱️ Property card clicked!', { propertyId: property.propertyId, title: property.title })
          e.preventDefault()
          e.stopPropagation()
          handlePropertyClick(property)
        }}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-1/3 h-64 md:h-auto overflow-hidden">
            <PropertyImageWithWatermarkFixed
              src={getPropertyImage(property) || '/icons/placeholder.jpg'}
              alt={property.title}
              className="w-full h-full object-cover"
              showWatermark={true}
              watermarkPosition="center"
              property={property}
              watermarkSize="medium"
            />
            
            {/* Overlay Elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            
            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <div className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                ID: {property.propertyId || property.id || 'N/A'}
              </div>
            </div>

            {/* My Property Badge */}
            {isAgent && property.agentId === user?.id && (
              <div className="absolute top-4 right-4">
                <div className="bg-green-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                  My Property
                </div>
              </div>
            )}


          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between h-full">
              {/* Main Content */}
              <div className="flex-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 mb-2">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-slate-600 mb-3">
                    <img 
                      src="/icons/location.gif" 
                      alt="Location" 
                      className="w-5 h-5 mr-2 object-contain"
                    />
                    <span className="text-lg">{property.location}</span>
                  </div>
                  {property.district && (
                    <div className="flex items-center text-slate-500 mb-3">
                      <MapPin className="w-5 h-5 mr-2 text-green-500" />
                      <span className="text-lg font-medium text-green-700">
                        {property.district}
                      </span>
                    </div>
                  )}
                  
                  {/* Price Display */}
                  <div className="mb-6">
                    <div 
                      className="text-3xl md:text-4xl font-bold text-green-600"
                      dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center mb-6 space-x-8">
                  {/* For Sale properties: Show Sharciga instead of QOL/Suuli */}
                  {property.status === 'For Sale' ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <img 
                          src="/icons/sharci.gif" 
                          alt="Document" 
                          className="w-9 h-9 object-contain"
                        />
                        <div>
                          <div className="text-blue-800 text-sm font-bold mb-1">Sharciga</div>
                          <div className="text-lg font-bold text-slate-900">{property.documentType || 'Siyaad Barre'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <NextImage 
                          src="/icons/ruler.gif" 
                          alt="Measurement" 
                          width={32}
                          height={32}
                          className="w-9 h-9 object-contain"
                          loading="lazy"
                        />
                        <div>
                          <div className="text-blue-800 text-sm font-bold mb-1">Cabbirka</div>
                          <div className="text-xl font-bold text-slate-900">{property.measurement || 'N/A'}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* For Rent properties: Show QOL and Suuli only if values > 0 */
                    <>
                      {property.beds > 0 && (
                    <div className="flex items-center space-x-2">
                      <NextImage 
                        src="/icons/bed.png" 
                        alt="Bed" 
                        width={24}
                        height={24}
                        className="w-7 h-7 object-contain"
                        loading="lazy"
                      />
                      <div>
                        <div className="text-xl font-bold text-slate-900">{property.beds}</div>
                            <div className="text-blue-800 text-sm font-medium">Qol</div>
                      </div>
                    </div>
                  )}
                  
                      {property.baths > 0 && (
                    <div className="flex items-center space-x-2">
                      <video 
                        src="/icons/shower1.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-7 h-7 object-contain"
                      />
                      <div>
                        <div className="text-xl font-bold text-slate-900">{property.baths}</div>
                            <div className="text-blue-800 text-sm font-medium">Suuli</div>
                      </div>
                    </div>
                  )}
                    </>
                  )}



                </div>

                {/* Description removed - only shown on detail page */}
              </div>

              {/* Agent Section */}
              <div className="md:ml-8">
                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <HybridImage
                      src={getStableAvatarUrl(property.agentId || property.agent?.name || 'agent-1', property.agent?.image, false)}
                      alt={capitalizeName(property.agent?.name || 'Agent')}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold text-slate-900 text-base">
                          {capitalizeName(property.agent?.name || 'Agent')}
                        </div>
                        {(property.agent?.name?.toLowerCase().includes('kobac real estate') || 
                          property.agent?.name?.toLowerCase().includes('kobac real')) && (
                          <div className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full shadow-lg border border-white" style={{backgroundColor: '#1877F2'}}>
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {property.agent?.verified && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border" style={{backgroundColor: '#E3F2FD', color: '#1877F2', borderColor: '#1877F2'}}>
                            <Award className="w-3 h-3" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        <span 
                          className="cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            if (property.agent?.phone) {
                              // Clean the phone number for tel: link and format with 061
                              const cleanPhone = property.agent.phone.replace(/\D/g, '');
                              const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                              const phoneLink = `tel:${formattedPhone}`;
                              window.location.href = phoneLink;
                            }
                          }}
                        >
                        {property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Contact Agent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <>
      {/* Redirect Animation */}
      <RedirectAnimation {...animationProps} />
      
      <section className="relative pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-16 sm:pb-20 md:pb-24 lg:pb-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="mb-8">
            {/* Mobile Agent Dashboard Button */}
            {isAuthenticated && user?.role === 'agent' && (
              <div className="sm:hidden mb-6 text-center">
                <Button 
                  onClick={handleAgentDashboardClick}
                  variant="secondary" 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl border-0 w-full max-w-xs transition-all duration-300 hover:scale-105"
                >
                  <User className="w-5 h-5 mr-2" />
                  Agent Dashboard
                </Button>
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {isAgent ? 'My Listings' : 'Featured Properties'}
                  </h2>
                  <p className="text-slate-600 text-lg">
                    {isAgent 
                      ? `You have ${agentProperties.length} properties listed. Browse all available properties below.`
                      : 'Discover our curated selection of premium properties'
                    }
                  </p>
                </div>
                
                {/* Agents Link */}
                <div className="mt-4 sm:mt-0">
                  <Link 
                    href="/agents" 
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </div>
              </div>
              
              {/* View Toggle and Refresh */}
              <div className="flex items-center space-x-4">
                {/* Refresh Button */}
                <button
                  onClick={() => propertyEventManager.notifyRefresh()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg"
                  title="Refresh properties"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                
                <div className="hidden sm:flex items-center bg-white rounded-2xl p-1 shadow-lg">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    whileHover={{ 
                      scale: 1.05,
                      y: -1,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                      viewMode === 'grid' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <motion.div
                      animate={{ 
                        rotate: viewMode === 'grid' ? [0, 5, -5, 0] : 0,
                        scale: viewMode === 'grid' ? 1.1 : 1
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: viewMode === 'grid' ? Infinity : 0, ease: "easeInOut" },
                        scale: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <Grid className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-medium">Grid</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    whileHover={{ 
                      scale: 1.05,
                      y: -1,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                      viewMode === 'list' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <motion.div
                      animate={{ 
                        rotate: viewMode === 'list' ? [0, 5, -5, 0] : 0,
                        scale: viewMode === 'list' ? 1.1 : 1
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: viewMode === 'list' ? Infinity : 0, ease: "easeInOut" },
                        scale: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <List className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-medium">List</span>
                  </motion.button>
                </div>
                
                {/* District Info */}
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>{availableDistricts.length} Degmo</span>
                </div>
                
                {/* Mobile View Toggle */}
                <div className="sm:hidden flex items-center bg-white rounded-2xl p-1 shadow-lg">
                  <motion.button
                    onClick={() => setViewMode('grid')}
                    whileHover={{ 
                      scale: 1.1,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ 
                      scale: 0.9,
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      viewMode === 'grid' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <motion.div
                      animate={{ 
                        rotate: viewMode === 'grid' ? [0, 5, -5, 0] : 0,
                        scale: viewMode === 'grid' ? 1.2 : 1
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: viewMode === 'grid' ? Infinity : 0, ease: "easeInOut" },
                        scale: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <Grid className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                  <motion.button
                    onClick={() => setViewMode('list')}
                    whileHover={{ 
                      scale: 1.1,
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    whileTap={{ 
                      scale: 0.9,
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      viewMode === 'list' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <motion.div
                      animate={{ 
                        rotate: viewMode === 'list' ? [0, 5, -5, 0] : 0,
                        scale: viewMode === 'list' ? 1.2 : 1
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: viewMode === 'list' ? Infinity : 0, ease: "easeInOut" },
                        scale: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      <List className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* Filters Section */}
            <PropertyFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableDistricts={availableDistricts}
              className="mb-6"
            />
            
            {/* Results Count */}
            {!loading && !error && (
              <div className="flex items-center justify-between mb-6">
                <div className="text-slate-600">
                  {isAgent ? (
                  <>
                    {agentProperties.length > 0 && (
                      <span className="font-semibold text-blue-600">{agentProperties.length} my properties</span>
                    )}
                    {agentProperties.length > 0 && otherProperties.length > 0 && (
                      <span className="text-slate-500 mx-2">•</span>
                    )}
                    {otherProperties.length > 0 && (
                      <span className="font-semibold text-slate-900">{otherProperties.length} other properties</span>
                    )}
                  </>
                ) : (
                  <span className="font-semibold text-slate-900">{displayProperties.length} properties</span>
                )}
                  {hasActiveFilters && (
                    <span className="text-slate-500">
                      {' '}matching your filters
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ listingType: 'all', district: '' })}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>



          {/* Properties Grid/List */}
          <div className={cn(
            "grid gap-2 sm:gap-4 md:gap-6 lg:gap-8",
            viewMode === 'grid' 
              ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2" 
              : "grid-cols-1"
          )}>
            {loading ? (
              <div className="col-span-full relative">
                <div className="text-center py-8 sm:py-12">
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                      Loading Properties...
                    </h3>
                    <p className="text-slate-600 text-base sm:text-lg">Discovering amazing properties for you</p>
                  </div>
                  
                  {/* Animated Loading Cards - Mobile Optimized */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
                    {[...Array(4)].map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.1,
                          repeat: Infinity,
                          repeatType: "reverse",
                          repeatDelay: 0.3
                        }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
                      >
                        {/* Animated Image Placeholder - Mobile Optimized */}
                        <div className="relative h-32 sm:h-40 md:h-48 lg:h-60 overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500"
                            animate={{
                              background: [
                                "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)",
                                "linear-gradient(45deg, #ec4899, #3b82f6, #8b5cf6)",
                                "linear-gradient(45deg, #8b5cf6, #ec4899, #3b82f6)",
                                "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)"
                              ]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          
                          {/* Floating Elements - Mobile Optimized */}
                          <motion.div
                            className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-full backdrop-blur-sm"
                            animate={{
                              y: [0, -5, 0],
                              scale: [1, 1.1, 1],
                              rotate: [0, 180, 360]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <motion.div
                            className="absolute top-4 right-3 sm:top-6 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400/30 rounded-full"
                            animate={{
                              y: [0, 8, 0],
                              x: [0, 5, 0],
                              scale: [1, 0.8, 1]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.3
                            }}
                          />
                          <motion.div
                            className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 bg-green-400/30 rounded-full"
                            animate={{
                              y: [0, -4, 0],
                              rotate: [0, 90, 180, 270, 360],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        </div>
                        
                        {/* Content Placeholder - Mobile Optimized */}
                        <div className="p-2 sm:p-3 md:p-4 lg:p-6">
                          {/* Title Placeholder */}
                          <motion.div
                            className="h-3 sm:h-4 bg-slate-200 rounded mb-1 sm:mb-2"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              scale: [0.98, 1, 0.98]
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          <motion.div
                            className="h-2 sm:h-3 bg-slate-200 rounded mb-2 sm:mb-3 w-3/4"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              scale: [0.98, 1, 0.98]
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.2
                            }}
                          />
                          
                          {/* Price Placeholder */}
                          <motion.div
                            className="h-4 sm:h-5 md:h-6 bg-green-200 rounded mb-2 sm:mb-3 w-1/2"
                            animate={{
                              opacity: [0.6, 1, 0.6],
                              scale: [0.95, 1.02, 0.95]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          
                          {/* Stats Placeholder - Mobile Optimized */}
                          <div className="grid grid-cols-2 gap-1 sm:gap-2">
                            {[...Array(4)].map((_, statIndex) => (
                              <motion.div
                                key={statIndex}
                                className="h-6 sm:h-7 md:h-8 bg-slate-100 rounded"
                                animate={{
                                  opacity: [0.4, 0.8, 0.4],
                                  scale: [0.95, 1, 0.95]
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: statIndex * 0.1
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Fun Loading Message - Mobile Optimized */}
                  <motion.div
                    className="mt-6 sm:mt-8"
                    animate={{
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2 text-slate-600">
                      <motion.div
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-purple-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-pink-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4
                        }}
                      />
                      <span className="ml-2 text-xs sm:text-sm font-medium">Finding your perfect property...</span>
                    </div>
                  </motion.div>
                  

                </div>
              </div>
            ) : error ? (
              <div className="col-span-full text-center py-20">
                <div className="text-xl text-red-600">Error loading properties: {error}</div>
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="text-xl text-slate-600 mb-4">
                  {hasActiveFilters ? 'No properties match your filters' : 'No properties found'}
                </div>
                <div className="text-sm text-slate-500 mb-6">
                  {loading ? 'Loading properties...' : 
                   hasActiveFilters ? 'Try adjusting your filters or browse all properties.' : 
                   'No properties have been uploaded yet.'}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ listingType: 'all', district: '' })}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Agent's own properties */}
                {isAgent && agentProperties.length > 0 && (
                  <>
                    <div className="col-span-full mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                            My Properties ({agentProperties.length})
                          </h3>
                          <p className="text-slate-600">
                            Your listed properties are highlighted below
                          </p>
                        </div>
                      </div>
                    </div>
                    {agentProperties.map((property, index) => 
                      viewMode === 'grid' ? (
                        <GridCard key={`agent-${getPropertyKey(property, index)}`} property={property} index={index} />
                      ) : (
                        <ListCard key={`agent-${getPropertyKey(property, index)}`} property={property} index={index} />
                      )
                    )}
                  </>
                )}

                {/* Other properties */}
                {otherProperties.length > 0 && (
                  <>
                    {isAgent && agentProperties.length > 0 && (
                      <div className="col-span-full mb-8 mt-12">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-700 mb-2">
                              Other Properties ({otherProperties.length})
                            </h3>
                            <p className="text-slate-600">
                              Properties listed by other agents
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {otherProperties.map((property, index) => 
                      viewMode === 'grid' ? (
                        <GridCard key={`other-${getPropertyKey(property, index)}`} property={property} index={index} />
                      ) : (
                        <ListCard key={`other-${getPropertyKey(property, index)}`} property={property} index={index} />
                      )
                    )}
                  </>
                )}

                {/* Show message if no properties at all */}
                {!isAgent && agentProperties.length === 0 && otherProperties.length === 0 && (
                  <div className="col-span-full text-center py-20">
                    <div className="text-xl text-slate-600 mb-4">
                      No properties found
                    </div>
                    <div className="text-sm text-slate-500">
                      No properties have been uploaded yet.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>


        </div>
      </section>

    </>
  )
}

