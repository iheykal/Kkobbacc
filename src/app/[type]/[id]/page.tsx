'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import { PropertyDetail } from '@/components/sections/PropertyDetail'
import { PropertyLoadingAnimation } from '@/components/ui/PropertyLoadingAnimation'
import { StateRestoredIndicator } from '@/components/ui/StateRestoredIndicator'
import { useNavigation } from '@/contexts/NavigationContext'
import { useViewCounter } from '@/hooks/useViewCounter'
import { incrementPropertyView } from '@/lib/viewIncrement'
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

export default function PropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { goBack, preserveState, getPreservedState, isReturningFromBack, showStateRestored } = useNavigation()
  const { viewCount, isReturningFromBack: viewCounterReturning } = useViewCounter({ 
    propertyId: params.id as string 
  })
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [originUrl, setOriginUrl] = useState('')
  const scrollPositionRef = useRef(0)
  const hasRestoredState = useRef(false)

  const propertyType = params.type as string
  const propertyId = params.id as string

  useEffect(() => {
    const fetchPropertyAndRedirect = async () => {
      try {
        setLoading(true)

        // Use existing API endpoint that handles both propertyId and _id
        const response = await fetch(`/api/properties/${propertyId}`)

        if (!response.ok) {
          throw new Error('Property not found')
        }

        const data = await response.json()

        if (data.success && data.data) {
          const fetchedProperty = data.data
          
          // Generate the new SEO-friendly URL
          const { generateSEOUrl } = await import('@/lib/seoUrlUtils')
          const seoUrl = generateSEOUrl({
            propertyType: fetchedProperty.propertyType || 'property',
            status: fetchedProperty.status || fetchedProperty.listingType || '',
            listingType: fetchedProperty.listingType,
            district: fetchedProperty.district || 'unknown',
            location: fetchedProperty.location,
            propertyId: fetchedProperty.propertyId || fetchedProperty._id,
            _id: fetchedProperty._id
          })

          // Redirect to the new SEO URL format
          console.log('🔄 Redirecting from old URL format to SEO URL:', seoUrl.seoUrl)
          router.replace(seoUrl.seoUrl)
          return
        } else {
          throw new Error('Property not found')
        }
      } catch (error) {
        console.error('Error fetching property for redirect:', error)
        setError('Property not found')
        setLoading(false)
      }
    }

    if (propertyId && propertyType) {
      fetchPropertyAndRedirect()
    }
  }, [propertyId, propertyType, router])
  
  // Legacy route - redirects to new SEO URL format
  // Keep this for backward compatibility with old URLs like /kiro/123 or /iib/456
  
  if (loading) {
    return <PropertyLoadingAnimation propertyType={propertyType as 'kiro' | 'iib'} />
  }

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
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => goBack()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* State Restoration Indicator */}
      <StateRestoredIndicator show={showStateRestored} />
      
      {/* SEO Meta Tags */}
      <Head>
        <title>{property.title} - {property.district} | Kobac Real Estate</title>
        <meta name="description" content={`${property.description.substring(0, 160)}... Located in ${property.district}, ${property.location}. ${property.propertyType} for ${property.status.toLowerCase()}.`} />
        <meta name="keywords" content={`${property.propertyType}, ${property.district}, ${property.location}, real estate, property, ${property.status.toLowerCase()}`} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={`${property.title} - ${property.district}`} />
        <meta property="og:description" content={property.description.substring(0, 160)} />
        <meta property="og:image" content={property.thumbnailImage || '/icons/kobac.png'} />
        <meta property="og:url" content={`${originUrl}/${propertyType}/${property.propertyId}`} />
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
              "@type": "RealEstateAgent",
              "name": property.title,
              "description": property.description,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": property.district,
                "addressRegion": property.location
              },
              "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": "USD"
              },
              "image": property.thumbnailImage,
              "url": `${originUrl}/${propertyType}/${property.propertyId}`,
              "datePosted": property.createdAt,
              "floorSize": property.sqft ? {
                "@type": "QuantitativeValue",
                "value": property.sqft,
                "unitCode": "SQF"
              } : undefined
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
                  onClick={() => goBack()}
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
          <PropertyDetail property={property} onClose={() => goBack()} />
          
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
