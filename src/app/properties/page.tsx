'use client'


export const dynamic = 'force-dynamic';
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import { Bed, Bath, MapPin, Heart, ArrowRight, Search, Filter, Grid, List } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PropertyImageWithWatermarkFixed } from '@/components/ui/PropertyImageWithWatermarkFixed'
import { ResponsivePropertyImage } from '@/components/ui/ResponsivePropertyImage'
import { AdaptivePropertyImage } from '@/components/ui/AdaptivePropertyImage'
import HybridImage from '@/components/ui/HybridImage'
import { cn, formatPrice, formatPhoneNumber, capitalizeName, DEFAULT_AVATAR_URL, getStableAvatarUrl, getPropertyUrl } from '@/lib/utils'
import { getFirstName } from '@/utils/nameUtils'
import { useProperties } from '@/hooks/useProperties'
import { useNavigation } from '@/contexts/NavigationContext'

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

function PropertiesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setPreviousPage } = useNavigation()
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [propertyType, setPropertyType] = useState('all')
  const [status, setStatus] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [scrollPosition, setScrollPosition] = useState(0)
  const { properties, loading, error } = useProperties()
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Properties Debug:', {
      loading,
      error,
      propertiesCount: properties.length,
      properties: properties.slice(0, 2) // First 2 properties for debugging
    })
  }, [loading, error, properties])
  
  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Properties loading timeout - this might indicate an API issue')
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    }
  }, [loading])
  

  // Handle URL parameters on component mount
  useEffect(() => {
    const district = searchParams.get('district')
    if (district) {
      setDistrictFilter(district)
    }
  }, [searchParams])

  // Enable browser's natural scroll restoration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'auto'
    }
  }, [])

  // Simple scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Listen for property click events from recommendations
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRecommendationClick = (event: CustomEvent) => {
      const property = event.detail
      handlePropertyClick(property)
    }

    window.addEventListener('propertyClick', handleRecommendationClick as EventListener)
    
    return () => {
      window.removeEventListener('propertyClick', handleRecommendationClick as EventListener)
    }
  }, [])

  const handlePropertyClick = async (property: any) => {
    console.log('🔍 Property clicked:', {
      title: property.title,
      agentId: property.agentId,
      agentIdType: typeof property.agentId,
      agent: property.agent
    })
    
    // Let browser handle scroll restoration naturally
    
    // Store current page for back navigation
    if (typeof window !== 'undefined') {
      setPreviousPage(window.location.pathname)
    }
    
    // Navigate to individual property page using SEO-friendly URL
    const targetUrl = getPropertyUrl(property)
    router.push(targetUrl)
  }


  // Filter properties based on search and filters
  // Also filter out expired and deleted properties that might have slipped through
  const filteredProperties = properties.filter(property => {
    // Skip properties that are deleted or pending deletion
    if (property.deletionStatus === 'deleted' || property.deletionStatus === 'pending_deletion') {
      return false;
    }
    
    // Skip expired properties - STRICT CHECK
    // Check isExpired flag first
    if (property.isExpired === true) {
      return false;
    }
    
    // Check if property has expired based on expiresAt date
    // This is a safety check in case API doesn't filter properly
    if (property.expiresAt) {
      try {
        const expiresDate = new Date(property.expiresAt);
        const now = new Date();
        // If expiresAt is in the past, property is expired
        if (expiresDate < now) {
          return false; // Property has expired
        }
      } catch (e) {
        // If date parsing fails, exclude the property to be safe
        console.warn('⚠️ Invalid expiresAt date for property:', property.propertyId || property._id);
        return false;
      }
    }
    
    // Additional check: if isExpired is explicitly false but expiresAt is in past, exclude it
    if (property.expiresAt && property.isExpired === false) {
      try {
        const expiresDate = new Date(property.expiresAt);
        if (expiresDate < new Date()) {
          return false; // Property has expired even if flag is false
        }
      } catch (e) {
        // Skip if date parsing fails
      }
    }
    
    // Search filter - safely handle null/undefined values
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
                         (property.title?.toLowerCase() || '').includes(searchLower) ||
                         (property.location?.toLowerCase() || '').includes(searchLower) ||
                         (property.description?.toLowerCase() || '').includes(searchLower)
    
    // Price filter - safely handle null/undefined values
    const propertyPrice = property.price || 0;
    const matchesPrice = (!priceRange.min || propertyPrice >= parseInt(priceRange.min)) &&
                        (!priceRange.max || propertyPrice <= parseInt(priceRange.max))
    
    // Type filter - safely handle null/undefined values
    const matchesType = propertyType === 'all' || 
                       (property.propertyType?.toLowerCase() || '') === propertyType.toLowerCase()
    
    // Status filter - safely handle null/undefined values
    const matchesStatus = status === 'all' || 
                         (property.status?.toLowerCase() || '') === status.toLowerCase()
    
    // District filter - safely handle null/undefined values
    const matchesDistrict = districtFilter === 'all' || 
                           (property.district || '') === districtFilter
    
    return matchesSearch && matchesPrice && matchesType && matchesStatus && matchesDistrict
  })

  // Helper function to get property key
  const getPropertyKey = (property: any, index: number) => {
    return property._id || property.propertyId || property.id || index
  }

  // Helper function to get property image
  const getPropertyImage = (property: any) => {
    return property.thumbnailImage || property.images?.[0] || property.image
  }

  const propertyTypes = ['all', 'villa', 'apartment', 'dabaq', 'house', 'condo', 'penthouse', 'mansion', 'estate']
  const statuses = ['all', 'for sale', 'for rent', 'sold', 'rented']

  return (
    <>
      <Head>
        <title>All Properties | Kobac Real Estate</title>
        <meta name="description" content="Browse our complete collection of premium properties in Mogadishu. Find your perfect home from luxury villas to modern apartments. Filter by location, price, and property type." />
        <meta name="keywords" content="properties, real estate, mogadishu, villas, apartments, houses, for sale, for rent, kobac real estate" />
        <link rel="canonical" href={`${typeof window !== 'undefined' ? window.location.origin : ''}/properties`} />
        <meta property="og:title" content="All Properties | Kobac Real Estate" />
        <meta property="og:description" content="Browse our complete collection of premium properties in Mogadishu." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}/properties`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="All Properties | Kobac Real Estate" />
        <meta name="twitter:description" content="Browse our complete collection of premium properties in Mogadishu." />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header Section */}
        <section className="relative py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            All Properties
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover our complete collection of premium properties, from luxury villas to modern apartments
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search properties by title, location, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* District Filter */}
            <div>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Districts</option>
                {Array.from(new Set(properties.map(p => p.district).filter(Boolean))).sort().map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                {propertyTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range and View Mode */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="flex gap-4">
              <Input
                type="number"
                placeholder="Min Price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="flex-1"
              />
            </div>

            <div className="flex items-center justify-center lg:justify-end gap-2">
              <span className="text-slate-600 font-medium">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'grid' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  viewMode === 'list' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <div className="text-right">
              <span className="text-slate-600 font-medium">
                {filteredProperties.length} properties found
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div>
              <div className="text-center py-8">
                <div className="text-xl text-slate-600 mb-4">Loading properties...</div>
                <div className="text-sm text-slate-500 mb-6">Please wait while we fetch the latest properties</div>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Refresh Page
                </Button>
              </div>
              
              {/* Skeleton loading */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-3xl overflow-hidden shadow-xl animate-pulse">
                    <div className="h-60 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="text-xl text-red-600">Error loading properties: {error}</div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-xl text-slate-600">No properties found matching your criteria</div>
            </div>
          ) : (
            <div className={cn(
              "grid gap-8",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}>
              {filteredProperties.map((property, index) => (
                <div
                  key={getPropertyKey(property, index)}
                  className="group"
                >
                  <div 
                    className={cn(
                      "relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2",
                      viewMode === 'list' && "flex"
                    )}
                    onClick={() => handlePropertyClick(property)}
                  >
                    {/* Image Section */}
                    <div className={cn(
                      "relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center",
                      viewMode === 'grid' 
                        ? "min-h-[240px] md:min-h-[320px] max-h-[400px]" 
                        : "min-h-[192px] w-64 flex-shrink-0 max-h-[300px]"
                    )}>
                      <AdaptivePropertyImage
                        property={property}
                        alt={property.title}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                        showWatermark={true}
                        watermarkPosition="center"
                        watermarkSize="medium"
                        sizingMode="adaptive"
                        onError={(error) => {
                          console.warn('Property image error:', error)
                        }}
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
                      <div className="absolute top-6 right-6 flex flex-col gap-2">
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
                    <div className={cn(
                      "p-4 md:p-8",
                      viewMode === 'list' && "flex-1"
                    )}>
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

                      {/* Stats Grid - Show different fields based on property type */}
                      <div className={`grid gap-4 md:gap-6 mb-6 md:mb-8 ${
                        property.status === 'For Sale' 
                          ? (property.beds > 0 && property.baths > 0 ? 'grid-cols-4' : 'grid-cols-2')
                          : 'grid-cols-2'
                      }`}>
                        {/* For Sale properties: Show Sharciga and Cabbirka, plus optional QOL/Suuli */}
                        {property.status === 'For Sale' ? (
                          <>
                            <div className="text-center group/stat">
                              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                <img 
                                  src="/icons/sharci.gif" 
                                  alt="Document" 
                                  className="w-9 h-9 md:w-11 md:h-11 object-contain"
                                />
                              </div>
                              <div className="text-sm md:text-base font-bold text-slate-900 mb-1">{property.documentType || 'Siyaad Barre'}</div>
                              <div className="text-blue-800 text-xs md:text-sm font-medium">Sharciga</div>
                            </div>
                            
                            <div className="text-center group/stat">
                              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                <img 
                                  src="/icons/ruler.gif" 
                                  alt="Measurement" 
                                  className="w-9 h-9 md:w-11 md:h-11 object-contain"
                                />
                              </div>
                              <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{(property as any).measurement || 'N/A'}</div>
                              <div className="text-blue-800 text-xs md:text-sm font-medium">Cabbirka</div>
                            </div>
                            
                            {/* Optional Qol and Suuli for For Sale properties */}
                            {property.beds > 0 && (
                              <div className="text-center group/stat">
                                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                  <img 
                                    src="/icons/bed.png" 
                                    alt="Bed" 
                                    className="w-7 h-7 md:w-9 md:h-9 object-contain"
                                  />
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.beds}</div>
                                <div className="text-blue-800 text-xs md:text-sm font-medium">Qol</div>
                              </div>
                            )}
                            
                            {property.baths > 0 && (
                              <div className="text-center group/stat">
                                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                  <video 
                                    src="/icons/shower1.mp4" 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline
                                    className="w-9 h-9 md:w-11 md:h-11 object-contain mix-blend-multiply"
                                    style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                                  />
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.baths}</div>
                                <div className="text-blue-800 text-xs md:text-sm font-medium">Suuli</div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* For Rent properties: Show QOL and Suuli only if values > 0 */
                          <>
                            {property.beds > 0 && (
                              <div className="text-center group/stat">
                                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-2 md:mb-3 group-hover/stat:scale-110 transition-transform duration-300">
                                  <img 
                                    src="/icons/bed.png" 
                                    alt="Bed" 
                                    className="w-7 h-7 md:w-9 md:h-9 object-contain"
                                  />
                                </div>
                                <div className="text-lg md:text-2xl font-bold text-slate-900 mb-1">{property.beds}</div>
                                <div className="text-blue-800 text-xs md:text-sm font-medium">Qol</div>
                              </div>
                            )}
                            
                            {property.baths > 0 && (
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
                                <div className="text-blue-800 text-xs md:text-sm font-medium">Suuli</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Agent Preview */}
                      <div className="flex items-center p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4 md:mb-6">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <HybridImage
                            src={getStableAvatarUrl(property.agentId || property.agent?.name || 'agent-1', property.agent?.image, false)}
                            alt={getFirstName(property.agent?.name)}
                            width={48}
                            height={48}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 text-sm md:text-base">
                              {getFirstName(property.agent?.name)}
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

                      {/* View Details Button */}
                      <Button 
                        variant="primary" 
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      </div>
    </>
  )
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-slate-600">Loading properties...</div>
        </div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  )
}

