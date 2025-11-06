'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { incrementPropertyView } from '@/lib/viewIncrement'
import { 
  Bed, 
  Bath, 
  MapPin,
  Heart, 
  Share2, 
  Phone, 
  Mail, 
  ArrowLeft,
  ArrowRight,
  Home,
  Calendar,
  Ruler,
  ExternalLink,
  Award,
  Shield,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PropertyImageWithWatermarkFixed } from '@/components/ui/PropertyImageWithWatermarkFixed'
import EnhancedImageGallery from '@/components/ui/EnhancedImageGallery'
import { PropertyImageGallery } from '@/components/ui/FlexibleImage'
import { PropertyRecommendations } from './PropertyRecommendations'
import { formatPrice, formatPhoneNumber, formatListingDate, capitalizeName, DEFAULT_AVATAR_URL } from '@/lib/utils'
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver'

// Safe agent ID resolver function
function resolveAgentId(property: any): string | number | undefined {
  if (!property) return undefined;
  
  if (typeof property.agentId === 'string') {
    return property.agentId;
  }
  
  if (typeof property.agentId === 'number') {
    return property.agentId;
  }
  
  if (property.agentId && typeof property.agentId === 'object') {
    if (property.agentId._id) {
      return property.agentId._id;
    }
    if (property.agentId.id) {
      return property.agentId.id;
    }
  }
  
  if (property.agent && property.agent.id) {
    return property.agent.id;
  }
  
  if (property.agent && property.agent._id) {
    return property.agent._id;
  }
  
  if (property.agentId) {
    return String(property.agentId);
  }
  
  return undefined;
}

interface PropertyDetailModalProps {
  property: {
    id?: number
    _id?: string
    propertyId?: number
    title: string
    location: string
    district?: string
    price: number
    beds: number
    baths: number
    yearBuilt: number
    lotSize: number
    propertyType: string
    status: string
    description: string
    documentType?: string
    measurement?: string
    features: string[]
    amenities: string[]
    thumbnailImage?: string
    images: string[]
    agentId?: string | { _id?: string; id?: string }
    createdAt?: string | Date
    agent: {
      id?: string
      name: string
      phone: string
      email: string
      image: string
      rating: number
      verified?: boolean
    }
  }
  onClose: () => void
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ property, onClose }) => {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Get all image URLs
  const allImageUrls = React.useMemo(() => {
    console.log('🔍 PropertyDetailModal: Getting image URLs for property:', {
      propertyId: property.propertyId || property._id,
      thumbnailImage: property.thumbnailImage,
      images: property.images,
      thumbnailImageType: typeof property.thumbnailImage,
      imagesType: typeof property.images,
      imagesLength: property.images?.length,
      hasThumbnailImage: !!property.thumbnailImage,
      hasImages: !!property.images,
      imagesArray: Array.isArray(property.images) ? property.images : 'not an array'
    });
    
    const urls = getAllImageUrls(property);
    console.log('🔍 PropertyDetailModal: Resolved image URLs:', {
      urls,
      urlsLength: urls.length,
      urlsDetails: urls.map((url, index) => ({ index, url, type: typeof url }))
    });
    
    return urls;
  }, [property]);
  const [isFavorite, setIsFavorite] = useState(false)
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null)

  // Preload all images when modal opens for instant gallery navigation
  useEffect(() => {
    if (allImageUrls.length === 0) return;

    // Preload all images in the background
    allImageUrls.forEach((url: string) => {
      const img = new Image();
      img.src = url;
    });
  }, [allImageUrls]);

  // Function to get agent's first name
  const getAgentFirstName = () => {
    if (!property.agent?.name) return 'Agent'
    return (property.agent as any).name.split(' ')[0]
  }

  // Increment view count when property detail is opened
  useEffect(() => {
    const incrementViewCount = async () => {
      if (property.propertyId || property._id) {
        try {
          const propertyId = property.propertyId || property._id
          if (propertyId) {
            await incrementPropertyView(propertyId)
          }
        } catch (error) {
          // Silent error handling
        }
      }
    }

    incrementViewCount()
  }, [property.propertyId, property._id])

  const handleImageChange = (index: number) => {
    setSelectedImage(index)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const viewAgentSource = useCallback(async () => {
    console.log('🔍 Starting viewAgentSource with property:', {
      propertyId: property.propertyId || property._id,
      agentId: property.agentId,
      agent: property.agent,
      agentName: property.agent?.name,
      agentObjectKeys: property.agent ? Object.keys(property.agent) : 'no agent object',
      agentObjectValues: property.agent ? Object.entries(property.agent) : 'no agent object'
    });
    
    const resolvedAgentId = resolveAgentId(property);
    
    if (!resolvedAgentId) {
      console.warn('❌ No agent ID found for property:', property);
      return;
    }

    // Safely extract agentId as string
    const extractAgentIdAsString = (value: any): string | undefined => {
      if (!value) return undefined;
      if (typeof value === 'string') {
        if (value === '[object Object]' || value.includes('object Object')) return undefined;
        return value;
      }
      if (typeof value === 'number') return String(value);
      if (typeof value === 'object' && value !== null) {
        const id = (value as any)?._id || (value as any)?.id;
        if (id && (typeof id === 'string' || typeof id === 'number')) {
          const stringId = String(id);
          if (stringId !== '[object Object]' && !stringId.includes('object Object')) {
            return stringId;
          }
        }
      }
      return undefined;
    };

    const agentId = extractAgentIdAsString(resolvedAgentId);
    
    if (!agentId) {
      console.error('❌ Invalid agentId after extraction:', resolvedAgentId);
      alert('Invalid agent information. Please try again.');
      return;
    }

    console.log('✅ Resolved agent ID:', agentId);

    setLoadingAgentId(agentId);

    try {
      // Try to find agent by ID first
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log('✅ Found agent by ID:', result.data);
          // Extract ID from result.data.id safely
          const resultAgentId = extractAgentIdAsString(result.data.id) || agentId;
          try {
            const agentName = property.agent?.name || result.data?.name || '';
            const response = await fetch(`/api/agents/slug?agentId=${encodeURIComponent(resultAgentId)}&agentName=${encodeURIComponent(agentName)}`);
            if (response.ok) {
              const slugResult = await response.json();
              if (slugResult.success && slugResult.slug) {
                router.push(`/agent/${encodeURIComponent(slugResult.slug)}`);
                onClose();
                return;
              }
            }
          } catch (error) {
            console.warn('⚠️ Could not get agent slug, using ID as fallback:', error);
          }
          // Fallback to ID if slug generation fails
          router.push(`/agent/${encodeURIComponent(resultAgentId)}`);
          onClose();
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching agent by ID:', error);
    }

    // Fallback: try to find agent by name (this is deprecated, but kept for compatibility)
    // Note: This fallback should use the actual agent ID, not the name
    // The slug will be generated from the agent ID and name

    // Final fallback: use the resolved agent ID with slug
    console.log('🔄 Using final fallback agent ID:', agentId);
    try {
      const agentName = property.agent?.name || '';
      const response = await fetch(`/api/agents/slug?agentId=${encodeURIComponent(agentId)}&agentName=${encodeURIComponent(agentName)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.slug) {
          router.push(`/agent/${encodeURIComponent(result.slug)}`);
          onClose();
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not get agent slug, using ID as fallback:', error);
    }
    // Fallback to ID if slug generation fails
    router.push(`/agent/${encodeURIComponent(agentId)}`);
    onClose();
    
    // Let all preloads continue in background
    Promise.allSettled([]).then(() => {
      setLoadingAgentId(null);
    });
  }, [property, router, onClose]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Property Images */}
          <div className="mb-8">
            {allImageUrls.length > 0 ? (
              <EnhancedImageGallery
                property={property}
                showWatermark={true}
                watermarkPosition="center"
                watermarkSize="medium"
                showThumbnails={false}
              />
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Title and Price */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.price, property.status)}
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {property.status}
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{property.location}</span>
                  {property.district && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{property.district}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Bed className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.beds}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Bath className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.baths}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Ruler className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.lotSize}</div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{property.yearBuilt}</div>
                  <div className="text-sm text-gray-600">Year Built</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Features */}
              {property.features && property.features.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Agent Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div
                      onClick={viewAgentSource}
                      className="cursor-pointer hover:scale-110 transition-transform duration-300 inline-block"
                      title="View agent profile"
                    >
                    <img
                      src={property.agent?.image || DEFAULT_AVATAR_URL}
                      alt={capitalizeName(property.agent?.name || 'Agent')}
                        className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg hover:border-blue-500 transition-colors"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_AVATAR_URL;
                      }}
                    />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {capitalizeName(property.agent?.name || 'Agent')}
                    </h3>
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Award key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {property.agent?.rating || 5.0}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={viewAgentSource}
                        disabled={loadingAgentId === String(resolveAgentId(property))}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loadingAgentId === String(resolveAgentId(property)) ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </div>
                        ) : (
                          `View ${getAgentFirstName()}'s Profile`
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          if (property.agent?.phone) {
                            const cleanPhone = property.agent.phone.replace(/\D/g, '');
                            const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                            window.location.href = `tel:${formattedPhone}`;
                          }
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Call Agent'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleFavorite}
                  className={`w-full ${
                    isFavorite
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save Property'}
                </Button>
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: property.title,
                        text: property.description,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Property
                </Button>
              </div>
            </div>
          </div>

          {/* Property Recommendations */}
          <div className="mt-12">
            <PropertyRecommendations
              currentProperty={{
                _id: property._id,
                propertyId: property.propertyId,
                district: property.district || 'Unknown'
              }}
              onPropertyClick={(recommendedProperty) => {
                // Close current detail and open new one
                onClose()
                // Small delay to allow modal to close before opening new one
                setTimeout(() => {
                  // Trigger the property click event for the recommended property
                  // This will be handled by the parent component
                  const event = new CustomEvent('propertyClick', {
                    detail: recommendedProperty
                  });
                  window.dispatchEvent(event);
                }, 300);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
