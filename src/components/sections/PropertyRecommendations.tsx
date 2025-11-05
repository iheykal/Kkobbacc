'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bed, Bath, MapPin, Heart, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PropertyImageWithWatermark } from '@/components/ui/PropertyImageWithWatermark'
import { ResponsivePropertyImage } from '@/components/ui/ResponsivePropertyImage'
import { AdaptivePropertyImage } from '@/components/ui/AdaptivePropertyImage'
import HybridImage from '@/components/ui/HybridImage'
import { cn, formatPrice, formatPhoneNumber, capitalizeName, DEFAULT_AVATAR_URL, getStableAvatarUrl } from '@/lib/utils'
import { getFirstName } from '@/utils/nameUtils'
import { getPrimaryImageUrl } from '@/lib/imageUrlResolver'
import { getAgentProfileClickHandler } from '@/lib/agentNavigation'
import { useRouter } from 'next/navigation'

interface PropertyRecommendationsProps {
  currentProperty?: {
    _id?: string
    propertyId?: number
    district?: string
  }
  onPropertyClick: (property: any) => void
}

interface RecommendedProperty {
  _id: string
  propertyId?: number
  title: string
  location: string
  district: string
  price: number
  beds: number
  baths: number
  yearBuilt: number
  lotSize: number
  propertyType: string
  status: string
  documentType?: string
  measurement?: string
  description: string
  features: string[]
  amenities: string[]
  thumbnailImage: string
  images: string[]
  agentId: string
  agent: {
    name: string
    phone: string
    image: string
    rating: number
  }
  featured: boolean
  viewCount?: number
  createdAt: string
}

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

export const PropertyRecommendations: React.FC<PropertyRecommendationsProps> = React.memo(({
  currentProperty,
  onPropertyClick
}) => {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentProperty || !currentProperty?.district) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const excludeId = currentProperty?._id || currentProperty?.propertyId
        const params = new URLSearchParams({
          district: currentProperty?.district || '',
          limit: '6'
        })

        if (excludeId) {
          params.append('excludeId', String(excludeId))
        }

        const response = await fetch(`/api/properties/similar?${params}`, {
          cache: 'force-cache',
          next: { revalidate: 120 }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`)
        }

        const data = await response.json()
        setRecommendations(data.properties || [])
      } catch (err) {
        setError('Failed to load recommendations')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentProperty?.district, currentProperty?._id, currentProperty?.propertyId])

  // Helper function to get property image using resolver
  const getPropertyImage = useCallback((property: RecommendedProperty) => {
    return getPrimaryImageUrl(property)
  }, [])

  // Helper function to get property key
  const getPropertyKey = (property: RecommendedProperty, index: number) => {
    return property._id || property.propertyId || index
  }

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading similar properties...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null // Don't show anything if no recommendations
  }

  return (
    <div className="py-8 sm:py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Guryaha iyo dhulalka kale ee degmada <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-extrabold">{currentProperty?.district || 'this area'}</span> iyo agagaarkeeda
          </h2>
        </motion.div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {recommendations.map((property, index) => {
            // Debug agent data
            console.log('🔍 PropertyRecommendations: Agent data for property:', {
              propertyId: property._id,
              title: property.title,
              agent: property.agent,
              agentId: property.agentId
            });
            
            return (
            <motion.div
              key={getPropertyKey(property, index)}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group h-full w-full"
            >
              <div 
                className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 h-full flex flex-col max-w-full"
                onClick={(e) => {
                  // Only navigate to property if click is not on agent profile
                  if (!(e.target as HTMLElement).closest('[data-agent-profile]')) {
                    onPropertyClick(property);
                  }
                }}
              >
                {/* Image Section */}
                <div className="relative w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0 isolate">
                  {getPropertyImage(property) ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <AdaptivePropertyImage
                      property={property}
                      alt={property.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      showWatermark={true}
                      watermarkPosition="center"
                      watermarkSize="medium"
                        sizingMode="cover"
                        onError={() => {
                          // Silent error handling for better performance
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 absolute inset-0">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-sm text-center px-4">No Image Available</p>
                    </div>
                  )}
                  
                  {/* Overlay Elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Top Badges */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-2 z-10 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                      {translateStatus(property.status)}
                    </div>
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-lg whitespace-nowrap">
                      ID: {property.propertyId || property._id || 'N/A'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
                    <button 
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg group/btn pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle favorite logic
                      }}
                    >
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 group-hover/btn:text-red-500 transition-colors duration-300" />
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
                  {/* Header */}
                  <div className="mb-3 sm:mb-4 flex-shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 mb-2 line-clamp-2">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-slate-600 mb-2">
                      <img 
                        src="/icons/location.gif" 
                        alt="Location" 
                        className="w-4 h-4 mr-2 object-contain flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm truncate">{property.location}</span>
                    </div>
                    <div className="flex items-center text-slate-500 mb-2 sm:mb-3">
                      <MapPin className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">{property.district}</span>
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-3 sm:mb-4">
                      <div 
                        className="text-xl sm:text-2xl font-bold text-green-600"
                        dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.status === 'For Rent' ? 'rent' : 'sale') }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid - Show different fields based on property type */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 flex-shrink-0">
                    {property.status === 'For Sale' ? (
                      /* For Sale properties: Show Sharciga and Cabbirka */
                      <>
                        <div className="text-center group/stat">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-1 sm:mb-2 group-hover/stat:scale-110 transition-transform duration-300 flex-shrink-0">
                            <img 
                              src="/icons/sharci.gif" 
                              alt="Document" 
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            />
                          </div>
                          <div className="text-blue-800 text-[10px] sm:text-xs font-bold mb-1">Sharciga</div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">{property.documentType || 'Siyaad Barre'}</div>
                        </div>
                        
                        <div className="text-center group/stat">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-1 sm:mb-2 group-hover/stat:scale-110 transition-transform duration-300 flex-shrink-0">
                            <img 
                              src="/icons/ruler.gif" 
                              alt="Measurement" 
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                            />
                          </div>
                          <div className="text-blue-800 text-[10px] sm:text-xs font-bold mb-1">Cabbirka</div>
                          <div className="text-sm sm:text-lg font-bold text-slate-900 truncate">{property.measurement || 'N/A'}</div>
                        </div>
                      </>
                    ) : (
                      /* For Rent properties: Show QOL and Suuli only if values > 0 */
                      <>
                        {property.beds > 0 && (
                          <div className="text-center group/stat">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-1 sm:mb-2 group-hover/stat:scale-110 transition-transform duration-300 flex-shrink-0">
                              <img 
                                src="/icons/bed.png" 
                                alt="Bed" 
                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                              />
                            </div>
                            <div className="text-sm sm:text-lg font-bold text-slate-900 mb-1">{property.beds}</div>
                            <div className="text-blue-800 text-[10px] sm:text-xs font-medium">Qol</div>
                          </div>
                        )}
                        
                        {property.baths > 0 && (
                          <div className="text-center group/stat">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-1 sm:mb-2 group-hover/stat:scale-110 transition-transform duration-300 flex-shrink-0">
                              <video 
                                src="/icons/shower1.mp4" 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                            <div className="text-sm sm:text-lg font-bold text-slate-900 mb-1">{property.baths}</div>
                            <div className="text-blue-800 text-[10px] sm:text-xs font-medium">Suuli</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Agent Preview */}
                  <div 
                    className="flex items-center p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-3 sm:mb-4 flex-shrink-0"
                    data-agent-profile
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div
                        data-agent-profile
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🖱️ Agent profile clicked in recommendations:', {
                            property: property,
                            agentId: property.agentId,
                            agent: property.agent
                          });
                          
                          // Navigate directly - ensure agentId is a string
                          let agentId: string | undefined;
                          if (property.agentId) {
                            if (typeof property.agentId === 'string') {
                              agentId = property.agentId;
                            } else if (typeof property.agentId === 'object' && property.agentId !== null) {
                              agentId = (property.agentId as any)?._id || (property.agentId as any)?.id;
                            } else {
                              agentId = String(property.agentId);
                            }
                          }
// Ensure it's a string and not [object Object]
                          if (agentId && typeof agentId !== 'string') {
                            agentId = typeof agentId === 'object' && agentId !== null
                              ? (agentId as any)?._id || (agentId as any)?.id || String(agentId)
                              : String(agentId);
                          }
                          
                          if (!agentId || agentId === '[object Object]' || agentId.includes('object Object')) {
                            console.error('❌ Invalid agentId:', agentId);
                            alert('Invalid agent information. Please try again.');
                            return;
                          }
                          
                          if (agentId && typeof window !== 'undefined') {
                            // Get agent slug for URL-friendly navigation
                            try {
                              const agentName = property.agent?.name || '';
                              const response = await fetch(`/api/agents/slug?agentId=${encodeURIComponent(agentId)}&agentName=${encodeURIComponent(agentName)}`);
                              if (response.ok) {
                                const result = await response.json();
                                if (result.success && result.slug) {
                                  const agentUrl = `/agent/${encodeURIComponent(result.slug)}`;
                                  console.log('🌐 Navigating to agent:', agentUrl);
                                  window.location.href = agentUrl;
                                  return;
                                }
                              }
                            } catch (error) {
                              console.warn('⚠️ Could not get agent slug, using ID as fallback:', error);
                            }
                            // Fallback to ID if slug generation fails
                            const agentUrl = `/agent/${encodeURIComponent(agentId)}`;
                            window.location.href = agentUrl;
                          } else {
                            console.error('❌ No agent ID found');
                          }
                        }}
                        className="cursor-pointer hover:scale-110 transition-transform duration-300 flex-shrink-0 z-50 relative pointer-events-auto"
                        title="View agent profile"
                        role="button"
                        tabIndex={0}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div style={{ pointerEvents: 'none' }}>
                          <HybridImage
                            src={getStableAvatarUrl(property.agentId || property.agent?.name || 'agent-1', property.agent?.image, false)}
                            alt={getFirstName(property.agent?.name)}
                            width={32}
                            height={32}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0 hover:border-blue-500 transition-colors pointer-events-none"
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {getFirstName(property.agent?.name)}
                        </div>
                        <div 
                          className="text-[10px] sm:text-xs text-slate-500 cursor-pointer hover:text-blue-600 transition-colors truncate"
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
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button 
              variant="outline"
              size="lg"
              className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 font-semibold px-8 py-3 rounded-xl"
              onClick={() => {
                // Close current property detail modal
                const closeEvent = new CustomEvent('closePropertyDetail')
                window.dispatchEvent(closeEvent)
                
                // Navigate to properties page with district filter
                setTimeout(() => {
                  window.location.href = `/properties?district=${encodeURIComponent(currentProperty?.district || '')}`
                }, 100)
              }}
            >
              <span className="text-green-600 font-extrabold">Dhammaan</span> <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-extrabold ml-2">{currentProperty?.district || 'this area'}</span>
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
})

PropertyRecommendations.displayName = 'PropertyRecommendations'
