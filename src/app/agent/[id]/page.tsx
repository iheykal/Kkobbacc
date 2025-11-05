'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigation } from '@/contexts/NavigationContext'
import { 
  Bed, 
  Bath, 
  Phone, 
  Mail, 
  ArrowLeft,
  Star,
  Calendar,
  Home,
  Award,
  Crown,
  MapPin,
  Heart,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyImageWithWatermark } from '@/components/ui/PropertyImageWithWatermark'
import { formatPrice, formatPhoneNumber, capitalizeName, DEFAULT_AVATAR_URL } from '@/lib/utils'
import { PropertyDetail } from '@/components/sections/PropertyDetail'

// Helper function to translate property status to Somali
const translateStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'for sale':
    case 'for-sale':
      return 'Waa-iib'
    case 'for rent':
    case 'for-rent':
      return 'Waa Kiro'
    case 'sold':
      return 'La iibiyay'
    case 'rented':
      return 'La kireeyay'
    default:
      return status || 'Waa-iib'
  }
}

interface Agent {
  id: string
  name: string
  phone: string
  email: string
  image: string
  rating: number
}

interface Property {
  _id: string
  title: string
  location: string
  price: number
  beds: number
  baths: number
  yearBuilt: number
  lotSize: number
  propertyType: string
  status: string
  description: string
  features: string[]
  amenities: string[]
  images: string[]
  thumbnailImage?: string
  district?: string
  measurement?: string
  listingType?: string
  propertyId?: string
  agent: Agent
  featured: boolean
  createdAt: string
  updatedAt: string
}

export default function AgentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { setPreviousPage } = useNavigation()
  
  // Get slug from params (can be either slug or ID for backward compatibility)
  const slugOrId = params.id;
  
  // The slug/id can be:
  // 1. A URL-friendly slug (e.g., "kobac-real-estate")
  // 2. A MongoDB ObjectId (for backward compatibility)
  // 3. Invalid value (will be handled by API)
  
  // We'll let the API resolve it to an actual agentId
  // For now, just use the slug/id as-is for API calls
  const agentSlugOrId = typeof slugOrId === 'string' ? slugOrId : String(slugOrId || '');
  
  // Validate it's not [object Object]
  if (agentSlugOrId === '[object Object]' || agentSlugOrId.includes('object Object')) {
    console.error('❌ Invalid slug/ID in params:', slugOrId);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  }
  
  const [agent, setAgent] = useState<Agent | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  
  // Check if slug/ID is invalid - including URL-encoded [object Object]
  let decodedCheckSlug = agentSlugOrId;
  try {
    decodedCheckSlug = decodeURIComponent(agentSlugOrId);
  } catch (e) {
    decodedCheckSlug = agentSlugOrId;
  }
  
  const isInvalidSlug = !agentSlugOrId || 
    agentSlugOrId === '[object Object]' || 
    agentSlugOrId.includes('object Object') || 
    decodedCheckSlug === '[object Object]' || 
    decodedCheckSlug.includes('object Object') ||
    agentSlugOrId.length === 0 ||
    agentSlugOrId === '%5Bobject%20Object%5D' || // URL-encoded [object Object]
    agentSlugOrId.includes('%5Bobject%20Object%5D');
  const [loading, setLoading] = useState(!isInvalidSlug)
  const [error, setError] = useState<string | null>(
    isInvalidSlug 
      ? 'Invalid agent slug detected in URL. Redirecting to home page...' 
      : null
  )
  
  // Redirect immediately if slug is invalid
  useEffect(() => {
    if (isInvalidSlug && typeof window !== 'undefined') {
      console.error('❌ Invalid agent slug detected, redirecting to home page');
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000); // Give user 2 seconds to see the error message
      return () => clearTimeout(timer);
    }
  }, [isInvalidSlug])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // EARLY RETURN: Don't proceed if slug is invalid
    if (isInvalidSlug) {
      console.error('❌ Invalid agent slug in useEffect, skipping fetch:', agentSlugOrId);
      setError('Invalid agent slug detected. Redirecting to home page...');
      setLoading(false);
      return;
    }
    
    // Validate slug is a valid string before proceeding
    if (!agentSlugOrId || agentSlugOrId === '[object Object]' || agentSlugOrId.includes('object Object') || agentSlugOrId.length === 0) {
      console.error('❌ Invalid agent slug in useEffect:', agentSlugOrId);
      setError('Invalid agent slug. Please navigate from a property page.');
      setLoading(false);
      return;
    }
    
    if (agentSlugOrId && typeof agentSlugOrId === 'string' && agentSlugOrId.length > 0) {
      // Warm cache first, then fetch data
      // Use slug for API call - API will resolve it to agentId
      const warmCache = async () => {
        try {
          // Try to warm cache with minimal API
          await fetch(`/api/agents/${encodeURIComponent(agentSlugOrId)}/minimal`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
        } catch (error) {
          console.log('Cache warming failed, proceeding with normal fetch');
        }
      };
      
      warmCache().then(() => {
        fetchAgentData();
      });
    }
  }, [agentSlugOrId, isInvalidSlug])

  const fetchAgentData = async (isRetry = false) => {
    // CRITICAL: Validate slug BEFORE doing anything else
    // Check if slug is invalid first
    if (isInvalidSlug) {
      console.error('❌ BLOCKED: fetchAgentData called with invalid slug:', agentSlugOrId);
      setError('Invalid agent slug detected. Redirecting to home page...');
      setLoading(false);
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      return;
    }
    
    try {
      setLoading(true)
      setError(null)

      // CRITICAL: Validate slug is a valid string BEFORE making any API calls
      if (!agentSlugOrId || typeof agentSlugOrId !== 'string' || agentSlugOrId === '[object Object]' || agentSlugOrId.includes('object Object') || agentSlugOrId.length === 0) {
        console.error('❌ Invalid agent slug in fetchAgentData:', agentSlugOrId, 'Type:', typeof agentSlugOrId);
        setError('Invalid agent slug in URL. Please navigate from a property page.');
        setLoading(false);
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
        return;
      }
      
      // Additional validation - decode URL-encoded strings to check for [object Object]
      const decodedSlug = decodeURIComponent(agentSlugOrId);
      if (decodedSlug === '[object Object]' || decodedSlug.includes('object Object')) {
        console.error('❌ agent slug is URL-encoded [object Object]:', agentSlugOrId, 'Decoded:', decodedSlug);
        setError('Invalid agent slug format. Please navigate from a property page.');
        setLoading(false);
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
        return;
      }

      const encodedSlug = encodeURIComponent(agentSlugOrId);
      console.log('⚡ Fetching agent data for slug/ID:', agentSlugOrId, 'Encoded:', encodedSlug, isRetry ? `(Retry ${retryCount + 1})` : '')

      // Try instant API first (500ms timeout)
      const instantController = new AbortController()
      const instantTimeoutId = setTimeout(() => instantController.abort(), 500) // 500ms timeout

      let response;
      try {
        response = await fetch(`/api/agents/${encodedSlug}/instant`, {
          cache: 'no-store',
          signal: instantController.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        clearTimeout(instantTimeoutId)
        
        // Check if instant API returned "no cache" error
        if (response.status === 404) {
          const instantResult = await response.json()
          if (instantResult.code === 'NO_CACHE') {
            console.log('⚡ No cache available, trying minimal API...')
            throw new Error('NO_CACHE')
          }
        }
      } catch (instantError) {
        clearTimeout(instantTimeoutId)
        console.log('Instant API failed, trying minimal API:', instantError)
        
        // Try minimal API (1.5s timeout)
        const minimalController = new AbortController()
        const minimalTimeoutId = setTimeout(() => minimalController.abort(), 1500) // 1.5s timeout
        
        try {
          response = await fetch(`/api/agents/${encodedSlug}/minimal`, {
            cache: 'no-store',
            signal: minimalController.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          clearTimeout(minimalTimeoutId)
        } catch (minimalError) {
          clearTimeout(minimalTimeoutId)
          console.log('Minimal API failed, trying main API:', minimalError)
          
          // Fallback to main API (3s timeout)
          const mainController = new AbortController()
          const mainTimeoutId = setTimeout(() => mainController.abort(), 3000) // 3s timeout
          
          response = await fetch(`/api/agents/${encodedSlug}`, {
            cache: 'no-store',
            signal: mainController.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          clearTimeout(mainTimeoutId)
        }
      }
      
      const result = await response.json()

      console.log('⚡ Single API response:', result)

      if (response.ok && result.success && result.data) {
        const agentData = result.data
        setAgent({
          id: agentData.id,
          name: agentData.name,
          phone: agentData.phone,
          email: agentData.email,
          image: agentData.image,
          rating: 5.0
        })
        setProperties(agentData.properties || [])
        
        if (result.cached) {
          console.log('⚡ Data loaded from cache - instant response!')
        }
      } else {
        setError(result.error || 'Failed to load agent profile')
      }
    } catch (error) {
      console.error('Error in fetchAgentData:', error)
      
      // Retry logic for network errors
      const errorObj = error as Error
      if (retryCount < 2 && (errorObj.name === 'AbortError' || errorObj.message?.includes('fetch'))) {
        console.log(`🔄 Retrying in 1 second... (Attempt ${retryCount + 1}/3)`)
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          fetchAgentData(true)
        }, 1000)
        return
      }
      
      if (errorObj.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else if (errorObj.message?.includes('fetch')) {
        setError('Network error. Please check your internet connection.')
      } else {
        setError('Failed to load agent profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePropertyClick = (property: Property) => {
    // Store current page for back navigation
    if (typeof window !== 'undefined') {
      setPreviousPage(window.location.pathname)
    }
    
    // Navigate to property detail page using client-side routing for faster loading
    const propertyId = property.propertyId || property._id
    // Determine type based on status: "Kiro" for rent, "Iib" for sale
    const propertyType = property.status === 'For Rent' ? 'kiro' : 'iib'
    router.push(`/${propertyType}/${propertyId}`)
  }

  const handleCloseDetail = () => {
    setSelectedProperty(null)
  }

  const handleBack = () => {
    router.back()
  }

  // Helper function to get property key
  const getPropertyKey = (property: Property, index: number) => {
    return property._id || property.propertyId?.toString() || index
  }

  // Helper function to get property image
  const getPropertyImage = (property: Property) => {
    return property.thumbnailImage || property.images?.[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading agent profile...</p>
          <p className="text-sm text-gray-500 mt-1">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : '⚡ Optimized for speed'}
          </p>
          {retryCount > 0 && (
            <div className="mt-2">
              <div className="w-32 bg-gray-200 rounded-full h-2 mx-auto">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(retryCount / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-md">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error || 'Agent not found'}</p>
            <div className="flex gap-3 mt-4 justify-center">
              <Button 
                onClick={() => {
                  // Validate slug before retrying
                  if (isInvalidSlug || !agentSlugOrId || agentSlugOrId === '[object Object]' || agentSlugOrId.includes('object Object') || agentSlugOrId.length === 0) {
                    console.error('❌ Cannot retry with invalid agent slug:', agentSlugOrId);
                    alert('Cannot retry: Invalid agent slug in URL. Redirecting to home page...');
                    if (typeof window !== 'undefined') {
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 500);
                    }
                    return;
                  }
                  setRetryCount(0)
                  fetchAgentData()
                }}
                className="bg-blue-600 hover:bg-blue-700"
                variant="primary"
                disabled={isInvalidSlug}
              >
                🔄 Retry
              </Button>
              <Button 
                onClick={handleBack}
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Agent Profile</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                Kusoo dhawoow ciwaanka{' '}
                <span className="text-yellow-300">{capitalizeName(agent.name)}</span>
              </h2>
              <p className="text-blue-100 text-lg">
                Halkaan hoose waxaad ka arki kartaa dhamaan waxyaabaha uu soo dhigo{' '}
                <span className="font-semibold text-yellow-200">{capitalizeName(agent.name.split(' ')[0])}</span>
              </p>
            </div>
          </motion.div>

          {/* Agent Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg mb-8 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white/20 p-1">
                    <img
                      src={agent.image}
                      alt={capitalizeName(agent.name)}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = DEFAULT_AVATAR_URL
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {agent.rating.toFixed(1)}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">{capitalizeName(agent.name)}</h2>
                  <p className="text-blue-100 mb-4">Wakiilka Kobac Real Estate</p>
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span 
                        className="cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          if (agent.phone) {
                            // Clean the phone number for tel: link and format with 061
                            const cleanPhone = agent.phone.replace(/\D/g, '');
                            const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                            const phoneLink = `tel:${formattedPhone}`;
                            window.location.href = phoneLink;
                          }
                        }}
                      >
                        {formatPhoneNumber(agent.phone)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>



          {/* Properties Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Home className="w-6 h-6 mr-2" />
                Properties ({properties.length})
              </h2>
            </div>

            {properties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                  <p className="text-gray-600">This agent hasn't posted any properties yet.</p>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                  {properties.map((property, index) => (
                    <motion.div
                      key={getPropertyKey(property, index)}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="group"
                    >
                      <div 
                        className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
                        onClick={() => handlePropertyClick(property)}
                      >
                        {/* Image Section */}
                        <div className="relative overflow-hidden h-60 md:h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <PropertyImageWithWatermark
                            src={getPropertyImage(property)}
                            alt={property.title}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                            showWatermark={true}
                            watermarkPosition="center"
                            watermarkSize="medium"
                          />
                          
                          {/* Overlay Elements */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          
                          {/* Top Badges */}
                          <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                              {translateStatus(property.status)}
                            </div>
                            <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              ID: {property.propertyId || property._id || 'N/A'}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-6 right-6">
                            <button 
                              className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg group/btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Handle favorite logic
                              }}
                            >
                              <Heart className="w-5 h-5 text-slate-600 group-hover/btn:text-red-500 transition-colors duration-300" />
                            </button>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 md:p-8">
                          {/* Header */}
                          <div className="mb-4 md:mb-6">
                            <div className="mb-2 md:mb-3">
                              <h3 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                                {property.title}
                              </h3>
                            </div>
                            <div className="flex items-center text-slate-600 mb-3 md:mb-4">
                              <img 
                                src="/icons/location.gif" 
                                alt="Location" 
                                className="w-4 h-4 md:w-5 md:h-5 mr-2 object-contain"
                              />
                              <span className="text-base md:text-lg">{property.location}</span>
                            </div>
                            {property.district && (
                              <div className="flex items-center text-slate-500 mb-3 md:mb-4">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-500" />
                                <span className="text-base md:text-lg font-medium">{property.district}</span>
                              </div>
                            )}
                            
                            {/* Price Display */}
                            <div className="mb-4 md:mb-6">
                              <div 
                                className="text-2xl md:text-3xl font-bold text-green-600"
                                dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
                              />
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className={`grid gap-4 md:gap-6 mb-6 md:mb-8 ${
                            property.status === 'For Sale' 
                              ? (property.beds > 0 && property.baths > 0 ? 'grid-cols-3' : 'grid-cols-2')
                              : 'grid-cols-2'
                          }`}>
                            {/* Bedrooms and Bathrooms - Only show if values are greater than 0 */}
                            {property.beds > 0 && property.baths > 0 && (
                              <>
                                <div className="text-center group/stat">
                                  <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                    <img 
                                      src="/icons/bed.png" 
                                      alt="Bed" 
                                      className="w-7 h-7 md:w-9 md:h-9 object-contain"
                                    />
                                  </div>
                                  <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.beds}</div>
                                  <div className="text-slate-600 text-xs md:text-sm font-medium">Qol</div>
                                </div>
                                
                                <div className="text-center group/stat">
                                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                    <video 
                                      src="/icons/shower1.mp4" 
                                      autoPlay 
                                      loop 
                                      muted 
                                      playsInline
                                      className="w-9 h-9 md:w-11 md:h-11 object-contain"
                                    />
                                  </div>
                                  <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.baths}</div>
                                  <div className="text-slate-600 text-xs md:text-sm font-medium">Suuli</div>
                                </div>
                              </>
                            )}

                            {/* Measurement - Show for all properties for sale */}
                            {property.status === 'For Sale' && property.measurement && (
                              <div className="text-center group/stat">
                                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                  <img 
                                    src="/icons/ruler.gif" 
                                    alt="Measurement" 
                                    className="w-7 h-7 md:w-9 md:h-9 object-contain"
                                  />
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.measurement || 'N/A'}</div>
                                <div className="text-slate-600 text-xs md:text-sm font-medium">Cabbirka</div>
                              </div>
                            )}
                          </div>

                          {/* Agent Preview */}
                          <div className="flex items-center p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                            <div className="flex items-center space-x-3 md:space-x-4">
                              <img
                                src={property.agent?.image || DEFAULT_AVATAR_URL}
                                alt={capitalizeName(property.agent?.name || 'Agent')}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = DEFAULT_AVATAR_URL;
                                }}
                              />
                              <div>
                                <div className="font-semibold text-slate-900 text-sm md:text-base">
                                  {capitalizeName(property.agent?.name || 'Agent')}
                                </div>
                                <div className="text-xs text-slate-500">
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
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetail
          property={{
            ...selectedProperty,
            id: parseInt(selectedProperty._id),
            agentId: selectedProperty.agent.id,
            propertyId: selectedProperty.propertyId ? parseInt(selectedProperty.propertyId.toString()) : undefined
          }}
          onClose={handleCloseDetail}
        />
      )}
    </>
  )
}
