'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { User, Grid, List, Filter, Search, MapPin, Bed, Bath, Ruler, Users, RefreshCw, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { useProperties, FilterOptions } from '@/hooks/useProperties'
import { cn, getPropertyUrl } from '@/lib/utils'
import { PropertyImageWithWatermarkFixed } from '@/components/ui/PropertyImageWithWatermarkFixed'
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver'
import HybridImage from '@/components/ui/HybridImage'
import { getStableAvatarUrl, capitalizeName, formatPhoneNumber } from '@/lib/utils'
import { getFirstName } from '@/utils/nameUtils'
import { propertyEventManager } from '@/lib/propertyEvents'
import { getAgentProfileClickHandler } from '@/lib/agentNavigation'

// Helper function to format price
const formatPrice = (price: number, listingType?: string) => {
  if (!price) return 'Price on request'
  
  const formattedPrice = price.toLocaleString()
  
  if (listingType === 'rent') {
    return `$${formattedPrice}<span class="text-xs text-black font-thin tracking-wide">/Bishii</span>`
  }
  
  return `$${formattedPrice}`
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

// Beautiful property card with original design but simplified animations
const BeautifulPropertyCard = ({ property, index, viewMode }: { property: any; index: number; viewMode: 'grid' | 'list' }) => {
  const router = useRouter()
  const { setPreviousPage, preserveState } = useNavigation()
  const { user, isAuthenticated } = useUser()
  const { saveScrollPosition } = useScrollRestoration({
    key: 'home_page_state',
    enabled: true,
    delay: 100
  })

  const getPropertyImage = (property: any) => {
    const imageUrl = getPrimaryImageUrl(property)
    console.log('🖼️ Property image URL (R2):', {
      propertyId: property.propertyId || property._id,
      title: property.title,
      thumbnailImage: property.thumbnailImage,
      firstImage: property.images?.[0],
      fallbackImage: property.image,
      finalUrl: imageUrl
    })
    return imageUrl
  }

  const getPropertyKey = (property: any, index: number) => {
    return property._id || property.propertyId || property.id || index
  }

  const isAgent = isAuthenticated && user?.role === 'agent'

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
        
        // Save scroll position as backup (only if we're scrolled down)
        const currentScrollY = window.scrollY
        if (currentScrollY > 100) {
          sessionStorage.setItem('home_scroll_position', currentScrollY.toString())
          console.log('🚀 SampleHomes: Saved scroll position as backup:', currentScrollY)
        }
        
        console.log('🚀 SampleHomes: Navigating to property detail page')
      }
      
      // Navigate to property detail page
      const propertyId = property.propertyId || property._id
      if (!propertyId) {
        console.error('❌ Property ID not found:', property)
        return
      }

      // Use SEO-friendly URL format
      const targetUrl = getPropertyUrl(property)
      console.log('🚀 SampleHomes: Navigating to', targetUrl)
      router.push(targetUrl)
    } catch (error) {
      console.error('❌ Error handling property click:', error)
    }
  }

  // Grid View Card Component with original beautiful design
  const GridCard = ({ property, index }: { property: any; index: number }) => {
    // Preload property images on hover for faster modal opening
    const handleMouseEnter = () => {
      const allUrls = getAllImageUrls(property);
      allUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };

    return (
      <div
        key={getPropertyKey(property, index)}
        id={`property-card-${property.propertyId || property._id || index}`}
        data-property-card
        className="group relative opacity-0 animate-fade-in"
        style={{
          animationDelay: `${index * 50}ms`,
          animationFillMode: 'forwards'
        }}
      >
        <div 
          className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          onMouseEnter={handleMouseEnter}
          onClick={(e) => {
            // Only navigate to property if click is not on agent profile
            if (!(e.target as HTMLElement).closest('[data-agent-profile]')) {
              console.log('🖱️ Property card clicked!', { propertyId: property.propertyId, title: property.title })
              e.preventDefault()
              e.stopPropagation()
              handlePropertyClick(property)
            }
          }}
        >
          {/* Image Section */}
          <div className="relative h-40 sm:h-44 md:h-48 lg:h-52 xl:h-56 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <PropertyImageWithWatermarkFixed
              src={getPropertyImage(property) || '/icons/placeholder.jpg'}
              alt={property.title}
              className="w-full h-full object-contain object-center"
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
          <div className="p-2 sm:p-3 md:p-4 lg:p-4 xl:p-5">
            {/* Header */}
            <div className="mb-2 sm:mb-3 md:mb-4">
              <div className="mb-1 sm:mb-2 md:mb-3">
                <h3 className="text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {property.title}
                </h3>
              </div>
              <div className="flex items-center text-slate-600 mb-2 sm:mb-3 md:mb-4">
                <img 
                  src="/icons/location.webp" 
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
              <div className="mb-2 sm:mb-3 md:mb-4">
                <div 
                  className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-700"
                  dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
                />
              </div>
            </div>

            {/* Stats Grid - Show different fields based on property type */}
            <div className={`grid gap-1 sm:gap-2 md:gap-3 lg:gap-3 mb-2 sm:mb-3 md:mb-4 lg:mb-4 ${property.status === 'For Sale' ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {/* For Sale properties: Show Sharciga and Cabbirka instead of QOL/Suuli */}
              {property.status === 'For Sale' ? (
                <>
                  <div className="text-center group/stat">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                      <img 
                        src="/icons/sharci.gif" 
                        alt="Document" 
                        className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain"
                      />
                    </div>
                    <div className="text-xs sm:text-xs md:text-sm lg:text-base font-bold text-slate-900 mb-0.5 sm:mb-1">{property.documentType || 'Siyaad Barre'}</div>
                    <div className="text-blue-800 text-xs sm:text-sm font-medium">Sharciga</div>
                  </div>
                  
                  <div className="hidden sm:block text-center group/stat">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                      <img 
                        src="/icons/ruler.webp" 
                        alt="Measurement" 
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-12 lg:h-12 object-contain"
                      />
                    </div>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.measurement || 'N/A'}</div>
                    <div className="text-blue-800 text-xs sm:text-sm font-medium">Cabbirka</div>
                  </div>
                </>
              ) : (
                /* For Rent properties: Show QOL and Suuli only if values > 0 */
                <>
                  {property.beds > 0 && (
                    <div className="text-center group/stat">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                        <NextImage 
                          src="/icons/bed.png" 
                          alt="Bed" 
                          width={32}
                          height={32}
                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.beds}</div>
                      <div className="text-blue-800 text-xs sm:text-sm font-medium">QOL</div>
                    </div>
                  )}
                  
                  {property.baths > 0 && (
                    <div className="text-center group/stat">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-16 xl:h-16 flex items-center justify-center mx-auto mb-1 sm:mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                        <video 
                          src="/icons/shower1.mp4" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-10 lg:h-10 object-contain"
                        />
                      </div>
                      <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold text-slate-900 mb-0.5 sm:mb-1">{property.baths}</div>
                      <div className="text-blue-800 text-xs sm:text-sm font-medium">Suuli</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Description removed - only shown on detail page */}

            {/* Agent Profile */}
            {property.agent && (
              <div 
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg mb-3"
                data-agent-profile
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  data-agent-profile
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Agent profile clicked in grid card:', {
                      property: property,
                      agentId: property.agentId,
                      agent: property.agent
                    });
                    
                    // Navigate directly
                    const agentId = property.agentId || property.agent?._id || property.agent?.id;
                    if (agentId && typeof window !== 'undefined') {
                      console.log('🌐 Navigating to agent:', agentId);
                      window.location.href = `/agent/${agentId}`;
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
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0 hover:border-blue-500 transition-colors pointer-events-none"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 truncate">
                    {getFirstName(property.agent.name)}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {formatPhoneNumber(property.agent.phone)}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    )
  }

  // List View Card Component with original beautiful design
  const ListCard = ({ property, index }: { property: any; index: number }) => (
    <div
      key={getPropertyKey(property, index)}
      data-property-card
      className="group opacity-0 animate-fade-in"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'forwards'
      }}
    >
      <div 
        className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={(e) => {
          // Only navigate to property if click is not on agent profile
          if (!(e.target as HTMLElement).closest('[data-agent-profile]')) {
            console.log('🖱️ Property card clicked!', { propertyId: property.propertyId, title: property.title })
            e.preventDefault()
            e.stopPropagation()
            handlePropertyClick(property)
          }
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
            <div className="absolute top-4 left-4 flex flex-col gap-1">
              <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                ID: {property.propertyId || property.id || 'N/A'}
              </div>
            </div>

            {/* Top Right Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-1">
              {/* My Property Badge */}
              {isAgent && property.agentId === user?.id && (
                <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  My Property
                </div>
              )}
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center text-gray-600 mb-3">
                  <img 
                    src="/icons/location.webp" 
                    alt="Location" 
                    className="w-4 h-4 mr-2 flex-shrink-0 object-contain"
                  />
                  <span className="text-sm">{property.location}</span>
                </div>
                {property.district && (
                  <div className="flex items-center text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-700">
                      {property.district}
                    </span>
                  </div>
                )}
                {/* Description removed - only shown on detail page */}
              </div>
              
              {/* Property Stats */}
              <div className="flex items-center space-x-4 mb-4">
                {property.beds > 0 && (
                  <div className="flex items-center text-gray-600">
                    <NextImage 
                      src="/icons/bed.png" 
                      alt="Bed" 
                      width={16}
                      height={16}
                      className="w-4 h-4 mr-1 object-contain"
                      loading="lazy"
                    />
                    <span className="text-sm">{property.beds}</span>
                  </div>
                )}
                {property.baths > 0 && (
                  <div className="flex items-center text-gray-600">
                    <video 
                      src="/icons/shower1.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-4 h-4 mr-1 object-contain"
                    />
                    <span className="text-sm">{property.baths}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Ruler className="w-4 h-4 mr-1" />
                  <span className="text-sm">{property.sqft} sqft</span>
                </div>
              </div>
              
              {/* Price */}
              <div 
                className="text-2xl md:text-3xl font-bold text-green-700"
                dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
              />

              {/* Agent Profile */}
              {property.agent && (
                <div 
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mt-4" 
                  data-agent-profile
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    data-agent-profile
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🖱️ Agent profile clicked in list card:', {
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
                      if (!agentId) {
                        agentId = property.agent?._id || property.agent?.id;
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
                          const agentName = property.agent?.name || property.agent?.fullName || '';
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
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0 hover:border-blue-500 transition-colors pointer-events-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {getFirstName(property.agent.name)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatPhoneNumber(property.agent.phone)}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return viewMode === 'list' ? <ListCard property={property} index={index} /> : <GridCard property={property} index={index} />
}

// Add CSS animation for smooth fade-in
const fadeInStyle = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.6s ease-out;
  }
`

// Inject CSS
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = fadeInStyle
  if (!document.head.querySelector('style[data-fade-in]')) {
    styleSheet.setAttribute('data-fade-in', 'true')
    document.head.appendChild(styleSheet)
  }
}

export const SampleHomesSimplified: React.FC = () => {
  const { user, isAuthenticated } = useUser()
  const router = useRouter()
  const { setPreviousPage } = useNavigation()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<FilterOptions>({
    listingType: 'all',
    district: ''
  })
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0)
  
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }
  
  const { properties, loading, error } = useProperties(false, filters)
  
  // Get all properties for calculating available districts
  const { properties: allProperties } = useProperties(false, undefined)

  // Get unique districts
  const districts = Array.from(new Set(allProperties.map(p => p.district).filter(Boolean)))
  const availableDistricts = districts
  
  // Check if user is agent
  const isAgent = isAuthenticated && user?.role === 'agent'
  
  // Filter properties for agents
  const agentProperties = properties.filter(p => p.agentId === user?.id)
  const otherProperties = properties.filter(p => p.agentId !== user?.id)
  const displayProperties = isAgent ? [...agentProperties, ...otherProperties] : properties
  
  // Reset carousel index when properties change
  useEffect(() => {
    setCurrentPropertyIndex(0)
  }, [displayProperties.length, filters.listingType, filters.district])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Properties...</h2>
            <p className="text-gray-600">Please wait while we fetch the latest properties</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Properties</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    )
  }
  
  // Check for active filters
  const hasActiveFilters = filters.listingType !== 'all' || filters.district !== ''

  return (
    <>
      {/* Redirect Animation */}
      <RedirectAnimation {...animationProps} />
      
      <section className="relative pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-16 sm:pb-20 md:pb-24 lg:pb-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden" data-properties-section>
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
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                      viewMode === 'grid' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <div className={`transition-transform duration-300 ${viewMode === 'grid' ? 'scale-110' : 'scale-100'}`}>
                      <Grid className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300",
                      viewMode === 'list' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <div className={`transition-transform duration-300 ${viewMode === 'list' ? 'scale-110' : 'scale-100'}`}>
                      <List className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">List</span>
                  </button>
                </div>
                
                {/* District Info */}
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>{availableDistricts.length} Degmo</span>
                </div>
                
                {/* Mobile View Toggle */}
                <div className="sm:hidden flex items-center bg-white rounded-2xl p-1 shadow-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      viewMode === 'grid' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <div className={`transition-transform duration-300 ${viewMode === 'grid' ? 'scale-120' : 'scale-100'}`}>
                      <Grid className="w-4 h-4" />
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-300",
                      viewMode === 'list' 
                        ? "bg-blue-600 text-white shadow-md" 
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    <div className={`transition-transform duration-300 ${viewMode === 'list' ? 'scale-120' : 'scale-100'}`}>
                      <List className="w-4 h-4" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={filters.listingType}
                      onChange={(e) => setFilters(prev => ({ ...prev, listingType: e.target.value as any }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <select
                      value={filters.district}
                      onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Districts</option>
                      {availableDistricts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
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
                
                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilters({ listingType: 'all', district: '' })}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

          {/* Properties Grid/List */}
          {displayProperties.length > 0 ? (
            <div className={cn(
              "grid gap-3 sm:gap-4 md:gap-6",
              viewMode === 'grid' 
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {displayProperties.map((property, index) => (
                <BeautifulPropertyCard
                  key={property._id || property.propertyId || index}
                  property={property}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters to see more properties</p>
              <Button 
                onClick={() => setFilters({ listingType: 'all', district: '' })}
                variant="secondary"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Agent Dashboard Access */}
          {!isAuthenticated && user?.role === 'agent' && (
            <div className="mt-12 text-center">
              <Button 
                onClick={handleAgentDashboardClick}
                variant="secondary"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"
              >
                <User className="w-5 h-5 mr-2" />
                Access Agent Dashboard
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
