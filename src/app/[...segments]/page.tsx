'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import { PropertyDetail } from '@/components/sections/PropertyDetail'
import { PropertyLoadingAnimation } from '@/components/ui/PropertyLoadingAnimation'
import { StateRestoredIndicator } from '@/components/ui/StateRestoredIndicator'
import { useNavigation } from '@/contexts/NavigationContext'
import { useViewCounter } from '@/hooks/useViewCounter'
import { incrementPropertyView } from '@/lib/viewIncrement'
import { generateSEOUrl, parseSEOUrl } from '@/lib/seoUrlUtils'
import { getPropertyUrl } from '@/lib/utils'
import { ArrowLeft, Heart } from 'lucide-react'

interface Property {
  _id: string
  propertyId: number
  title: string
  location: string
  district: string
  price: number
  beds: number
  baths: number
  sqft?: number
  yearBuilt: number
  lotSize: number
  propertyType: string
  status: string
  listingType: string
  documentType?: string
  measurement?: string
  description: string
  features: string[]
  amenities: string[]
  thumbnailImage?: string
  images: string[]
  agentId: string
  agent: {
    name: string
    phone: string
    email: string
    image: string
    rating: number
  }
  featured: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

export default function SEOPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { goBack, preserveState, getPreservedState, isReturningFromBack, showStateRestored } = useNavigation()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [originUrl, setOriginUrl] = useState('')
  const [seoUrl, setSeoUrl] = useState('')
  const [hasHydratedFromCache, setHasHydratedFromCache] = useState(false)
  const scrollPositionRef = useRef(0)
  const hasRestoredState = useRef(false)

  // Get segments from params: ['apartment-kiro-ah', 'muqdisho', 'degmada-abdiaziz', '203']
  const segments = params.segments as string[]
  const segmentsPath = Array.isArray(segments) ? `/${segments.join('/')}` : ''

  // Parse the SEO URL to extract property ID
  const parsedUrl = segmentsPath ? parseSEOUrl(segmentsPath) : null
  // Extract propertyId - try parsed URL first, then last segment as fallback
  let propertyId: string | null = null
  if (parsedUrl?.propertyId) {
    propertyId = String(parsedUrl.propertyId)
  } else if (segments && segments.length > 0) {
    const lastSegment = segments[segments.length - 1]
    // Check if last segment is a number (propertyId)
    const numericId = parseInt(lastSegment)
    if (!isNaN(numericId) && isFinite(numericId)) {
      propertyId = String(numericId)
    } else {
      propertyId = lastSegment // Might be _id if it's a valid ObjectId
    }
  }
  
  console.log('🔍 Property ID extraction:', JSON.stringify({
    segments: Array.isArray(segments) ? segments : segments,
    segmentsPath,
    parsedUrl: parsedUrl ? {
      propertyType: parsedUrl.propertyType,
      status: parsedUrl.status,
      district: parsedUrl.district,
      propertyId: parsedUrl.propertyId
    } : null,
    extractedPropertyId: propertyId
  }, null, 2))

  const { viewCount, isReturningFromBack: viewCounterReturning } = useViewCounter({ 
    propertyId: propertyId as string 
  })

  useEffect(() => {
    if (!propertyId || typeof window === 'undefined') {
      return
    }

    const candidateKeys = new Set<string>([propertyId])
    if (parsedUrl?.propertyId) {
      candidateKeys.add(String(parsedUrl.propertyId))
    }
    if (segments && segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      candidateKeys.add(lastSegment)
    }

    for (const key of candidateKeys) {
      try {
        const cached = sessionStorage.getItem(`prefetched_property_${key}`)
        if (!cached) {
          continue
        }
        const parsed = JSON.parse(cached)
        if (parsed?.data) {
          setProperty(parsed.data)
          setLoading(false)
          setHasHydratedFromCache(true)
          console.log('⚡ Restored property from prefetched cache:', key)
          break
        }
      } catch (error) {
        console.warn('⚠️ Failed to restore prefetched property:', error)
      }
    }
  }, [propertyId, segmentsPath, parsedUrl?.propertyId])

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        if (!propertyId) {
          setError('Invalid property URL')
          setLoading(false)
          return
        }

        if (!hasHydratedFromCache) {
          setLoading(true)
        }

        // Check if this should open as a modal (from list navigation)
        const shouldOpenAsModal = sessionStorage.getItem('open_as_modal')
        if (shouldOpenAsModal === 'true') {
          // Clear the flag
          sessionStorage.removeItem('open_as_modal')
          
          // Redirect to the appropriate list page with modal open
          const isFromProperties = sessionStorage.getItem('kobac_previous_page')?.includes('/properties')
          if (isFromProperties) {
            router.push(`/properties?id=${propertyId}`, { scroll: false })
            return
          } else {
            // From main page, redirect to main page with modal
            router.push(`/?id=${propertyId}`, { scroll: false })
            return
          }
        }

        // Fetch property by ID
        console.log('🔍 Fetching property with ID:', propertyId)
        const response = await fetch(`/api/properties/${propertyId}`)

        console.log('🔍 API Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ API Error:', errorData)
          throw new Error(errorData.error || `Property not found (${response.status})`)
        }

        const data = await response.json()
        console.log('✅ API Response data:', { success: data.success, hasData: !!data.data })

        if (data.success && data.data) {
          const fetchedProperty = data.data
          
          // Cache the property data for instant loading next time
          const cachePayload = JSON.stringify({
            data: fetchedProperty,
            timestamp: Date.now()
          })

          try {
            const cacheKey = `property_${propertyId}`
            sessionStorage.setItem(cacheKey, cachePayload)

            if (fetchedProperty.propertyId) {
              sessionStorage.setItem(`prefetched_property_${fetchedProperty.propertyId}`, cachePayload)
            }
            if (fetchedProperty._id) {
              sessionStorage.setItem(`prefetched_property_${fetchedProperty._id}`, cachePayload)
            }
          } catch (cacheError) {
            console.warn('⚠️ Failed to cache property details:', cacheError)
          }
          
          // Generate the correct SEO URL for this property
          const correctSEOUrl = generateSEOUrl({
            propertyType: fetchedProperty.propertyType || 'property',
            status: fetchedProperty.status || fetchedProperty.listingType || '',
            listingType: fetchedProperty.listingType,
            district: fetchedProperty.district || 'unknown',
            location: fetchedProperty.location,
            propertyId: fetchedProperty.propertyId || fetchedProperty._id,
            _id: fetchedProperty._id
          })

          // If the current URL doesn't match the correct SEO URL, redirect
          if (segmentsPath !== correctSEOUrl.seoUrl) {
            console.log('🔄 Redirecting to correct SEO URL:', {
              current: segmentsPath,
              correct: correctSEOUrl.seoUrl
            })
            router.replace(correctSEOUrl.seoUrl)
            return
          }

          setSeoUrl(correctSEOUrl.seoUrl)
          setProperty(fetchedProperty)

          // Restore state if returning from back navigation
          if (isReturningFromBack && !hasRestoredState.current) {
            hasRestoredState.current = true
            restorePropertyState()
          }

          // Only increment view count if NOT returning from back navigation
          if (!isReturningFromBack) {
            try {
              await incrementPropertyView(propertyId)
            } catch (error) {
              console.error('Error incrementing view count:', error)
            }
          }
        } else {
          throw new Error('Property not found')
        }
      } catch (error) {
        console.error('Error fetching property:', error)
        setError('Property not found')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId, segmentsPath, router, isReturningFromBack, hasHydratedFromCache])

  // Separate effect for state restoration
  useEffect(() => {
    if (isReturningFromBack && property && !hasRestoredState.current) {
      hasRestoredState.current = true
      restorePropertyState()
    }
  }, [isReturningFromBack, property])

  // Set origin URL on client side to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)
    }
  }, [])

  // State preservation functions
  const savePropertyState = () => {
    if (property) {
      const stateToSave = {
        scrollPosition: scrollPositionRef.current,
        isFavorite,
        timestamp: Date.now()
      }
      preserveState(`property_${propertyId}`, stateToSave)
    }
  }

  const restorePropertyState = () => {
    const savedState = getPreservedState(`property_${propertyId}`)
    if (savedState) {
      // Restore favorite state
      setIsFavorite(savedState.isFavorite || false)
      
      // Restore scroll position after a short delay
      setTimeout(() => {
        if (savedState.scrollPosition > 0) {
          window.scrollTo(0, savedState.scrollPosition)
        }
      }, 100)
    }
  }

  // Save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Save state before navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePropertyState()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [property, isFavorite])

  const handleBack = () => {
    // Don't save property state - we want to restore the main page state instead
    console.log('🔙 Property page: Going back to main page, preserving main page scroll position')
    goBack()
  }

  if (loading) {
    // Determine property type for loading animation
    const propertyTypeStatus = parsedUrl?.status || 'kiro'
    return <PropertyLoadingAnimation propertyType={propertyTypeStatus as 'kiro' | 'iib'} />
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Generate SEO URL for meta tags
  const canonicalSEOUrl = seoUrl || generateSEOUrl({
    propertyType: property.propertyType,
    status: property.status,
    listingType: property.listingType,
    district: property.district,
    location: property.location,
    propertyId: property.propertyId || property._id,
    _id: property._id
  }).seoUrl

  return (
    <>
      {/* State Restoration Indicator */}
      <StateRestoredIndicator show={showStateRestored} />
      
      {/* SEO Meta Tags */}
      <Head>
        <title>{property.title} - {property.district} | Kobac Real Estate</title>
        <meta name="description" content={`${property.description.substring(0, 160)}... Located in ${property.district}, ${property.location}. ${property.propertyType} for ${property.status.toLowerCase()}.`} />
        <meta name="keywords" content={`${property.propertyType}, ${property.district}, ${property.location}, real estate, property, ${property.status.toLowerCase()}`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`${originUrl}${canonicalSEOUrl}`} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={`${property.title} - ${property.district}`} />
        <meta property="og:description" content={property.description.substring(0, 160)} />
        <meta property="og:image" content={property.thumbnailImage || '/icons/kobac.png'} />
        <meta property="og:url" content={`${originUrl}${canonicalSEOUrl}`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${property.title} - ${property.district}`} />
        <meta name="twitter:description" content={property.description.substring(0, 160)} />
        <meta name="twitter:image" content={property.thumbnailImage || '/icons/kobac.png'} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              "name": property.title,
              "description": property.description,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": property.district,
                "addressRegion": property.location,
                "addressCountry": "SO"
              },
              "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": "USD",
                "availability": property.status === 'For Rent' ? "https://schema.org/RentalAvailability" : "https://schema.org/InStock"
              },
              "image": property.thumbnailImage || property.images?.[0],
              "url": `${originUrl}${canonicalSEOUrl}`,
              "datePosted": property.createdAt,
              "floorSize": property.sqft ? {
                "@type": "QuantitativeValue",
                "value": property.sqft,
                "unitCode": "SQF"
              } : undefined,
              "numberOfBedroomsTotal": property.beds,
              "numberOfBathroomsTotal": property.baths,
              "yearBuilt": property.yearBuilt
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
                  <p className="text-sm text-gray-500">{property.district}, {property.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsFavorite(!isFavorite)
                    // Save state immediately when favorite status changes
                    setTimeout(() => savePropertyState(), 100)
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isFavorite 
                      ? 'text-red-600 bg-red-50 border border-red-200' 
                      : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Property Content - Reuse existing PropertyDetail component */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PropertyDetail 
            property={property} 
            onClose={handleBack}
            onPropertyClick={(recommendedProperty) => {
              // Navigate to the recommended property's detail page
              if (recommendedProperty) {
                const targetUrl = getPropertyUrl(recommendedProperty)
                console.log('🔍 Navigating to recommended property:', targetUrl)
                router.push(targetUrl)
              }
            }}
          />
          
          {/* View Counter */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600">
              This property has been viewed <span className="font-semibold text-blue-600">{viewCount}</span> times
              {viewCounterReturning && (
                <span className="ml-2 text-green-600 text-xs">(State preserved)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

