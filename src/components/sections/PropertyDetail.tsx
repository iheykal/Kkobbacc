

'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { PropertyImageGallery } from '@/components/ui/PropertyImageGallery'
import { PropertyRecommendations } from './PropertyRecommendations'
import { formatPrice, formatPhoneNumber, formatListingDate, capitalizeName, DEFAULT_AVATAR_URL, AGENT_AVATAR_URL } from '@/lib/utils'
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver'
import { navigateToAgentProfile } from '@/lib/agentNavigation'
import { useRoleAccess } from '@/hooks/useRoleAccess'

// Safe agent ID resolver function
function resolveAgentId(property: any): string | number | undefined {
  console.log('🔍 Resolving agent ID for property:', {
    propertyId: property.propertyId || property._id,
    agentId: property.agentId,
    agent: property.agent,
    agentKeys: property.agent ? Object.keys(property.agent) : 'no agent object'
  });

  // Try all possible ID fields in order of preference
  const possibleIds = [
    property.agentId, // Top-level agentId
    property.agent?.id, // agent.id
    (property.agent as any)?._id, // agent._id
    property.agent?.agentId, // agent.agentId
    property.agent?.userId, // agent.userId
    (property.agent as any)?.['user_id'], // agent.user_id
    (property.agent as any)?.['agent_id'] // agent.agent_id
  ];

  // Find the first valid ID
  for (const id of possibleIds) {
    console.log('🔍 Checking possible ID:', id, 'type:', typeof id);
    if (id && (typeof id === 'string' || typeof id === 'number')) {
      console.log('✅ Found valid agent ID:', id);
      return String(id); // Ensure it's a string
    }
  }

  // If agentId is an object (populated reference), extract the ID
  if (property.agentId && typeof property.agentId === 'object' && property.agentId !== null) {
    const objectId = (property.agentId as any)._id || (property.agentId as any).id;
    if (objectId) {
      console.log('✅ Found agent ID from populated object:', objectId);
      return String(objectId);
    }
  }

  // Special case: If we have agentId but no real user exists, use the agentId anyway
  // This handles cases where properties have agentId but the user was deleted
  if (property.agentId && typeof property.agentId === 'string' && property.agentId.length > 0) {
    console.log('✅ Found agent ID string (may not exist in users):', property.agentId);
    return String(property.agentId);
  }

  // If agent is an object with nested ID fields
  if (property.agent && typeof property.agent === 'object') {
    // Check for nested ID fields (only if they exist)
    const nestedIds = [
      (property.agent as any)._id,
      (property.agent as any).id,
      (property.agent as any).agentId,
      (property.agent as any).userId
    ];

    for (const id of nestedIds) {
      if (id && (typeof id === 'string' || typeof id === 'number')) {
        console.log('✅ Found agent ID from nested object:', id);
        return String(id);
      }
    }
  }

  console.log('❌ No valid agent ID found');
  console.log('🔍 Final check - property.agentId:', property.agentId, 'type:', typeof property.agentId);
  console.log('🔍 Final check - property.agent:', property.agent);

  // Last resort: if we have any agentId at all, use it
  if (property.agentId && String(property.agentId).length > 0) {
    console.log('✅ Using agentId as last resort:', property.agentId);
    return String(property.agentId);
  }

  return undefined;
}

interface PropertyDetailProps {
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
  onPropertyClick?: (property: any) => void
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose, onPropertyClick }) => {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)

  const { isAdmin } = useRoleAccess()
  // Determine which phone number to use
  const agentPhone = property.agent?.phone || '';
  const displayPhone = isAdmin() ? agentPhone : '0610251014';
  const displayLabel = isAdmin() ? (agentPhone ? formatPhoneNumber(agentPhone) : 'Contact Agent') : '061 025 1014';

  // Get all image URLs
  const allImageUrls = React.useMemo(() => {
    console.log('🔍 PropertyDetail: Getting image URLs for property:', {
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
    console.log('🔍 PropertyDetail: Resolved image URLs:', {
      urls,
      urlsLength: urls.length,
      urlsDetails: urls.map((url, index) => ({ index, url, type: typeof url }))
    });

    return urls;
  }, [property]);
  const [isFavorite, setIsFavorite] = useState(false)

  // Preload only the first image with high priority for LCP
  useEffect(() => {
    if (allImageUrls.length === 0) return;

    // Preload first image with high priority using link rel="preload"
    if (allImageUrls[0]) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = allImageUrls[0];
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }
    // Removed aggressive preloading of all other images to save bandwidth
  }, [allImageUrls]);

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

  // Listen for close events from recommendations
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleCloseEvent = () => {
      onClose()
    }

    window.addEventListener('closePropertyDetail', handleCloseEvent)

    return () => {
      window.removeEventListener('closePropertyDetail', handleCloseEvent)
    }
  }, [onClose])

  const handleImageChange = (index: number) => {
    setSelectedImage(index)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  const viewAgentSource = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🔍 PropertyDetail: Agent card clicked:', {
      propertyId: property.propertyId || property._id,
      agentId: property.agentId,
      agent: property.agent,
      agentName: property.agent?.name
    });

    // Navigate directly using window.location.href
    const agentId = property.agentId || property.agent?.id;
    if (agentId && typeof window !== 'undefined') {
      console.log('🌐 PropertyDetail: Navigating to agent:', agentId);
      window.location.href = `/agent/${agentId}`;
    } else {
      console.error('❌ PropertyDetail: No agent ID found');
      alert("Unable to open agent profile. Agent information not available.");
    }
  }, [property]);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto opacity-0 animate-fadeIn">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 transition-all duration-200 ease-out">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
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

        {/* Main Content */}
        <div className="flex-1 py-4 sm:py-8 transition-all duration-300 ease-out overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">

              {/* Left Side - Flexible Property Images */}
              <div className="space-y-4 sm:space-y-6 lg:col-span-2 w-full">
                {allImageUrls.length > 0 ? (
                  <div className="w-full">
                    <PropertyImageGallery
                      images={allImageUrls}
                      altPrefix={property.title}
                      aspectRatio="auto"
                      objectFit="contain"
                      enableZoom={false}
                      showThumbnails={false}
                      autoPlay={false}
                      watermark={{
                        src: "/icons/header.png",
                        position: "center",
                        size: "large",
                        opacity: 0.7
                      }}
                      containerClassName="w-full"
                    />
                  </div>
                ) : (
                  <div className="w-full min-h-[250px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500 p-8">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Available</h3>
                      <p className="text-gray-500 mb-4">Images for this property will be added soon</p>
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Contact agent for more details</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right Side - Property Details */}
              <div className="space-y-4 sm:space-y-6 lg:col-span-3 w-full overflow-hidden relative z-10">
                {/* Title & Price */}
                <div className="space-y-6 pt-2">
                  {/* Title & Price Section */}
                  <div className="space-y-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent leading-tight drop-shadow-sm">
                      {property.title}
                    </h1>
                    <div
                      className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent tracking-tight drop-shadow-sm"
                      dangerouslySetInnerHTML={{ __html: formatPrice(property.price) }}
                    />
                  </div>

                  {/* Location Details */}
                  <div className="flex flex-col gap-4 py-5 border-t border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent rounded-r-2xl pr-4 -ml-2 pl-2">
                    {property.district && (
                      <div className="flex items-center gap-4 group cursor-default">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm flex-shrink-0 border border-green-200/50">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-base sm:text-lg text-slate-900 font-extrabold group-hover:text-emerald-700 transition-colors">{property.district}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 group cursor-default">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm flex-shrink-0 border border-blue-200/50">
                        <video
                          src="/icons/Adress3.webm"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-7 h-7 object-contain mix-blend-multiply"
                        />
                      </div>
                      <span className="text-base sm:text-lg text-slate-900 font-bold group-hover:text-blue-700 transition-colors">{property.location}</span>
                    </div>
                  </div>

                  {/* Meta Information (ID & Date) */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 font-medium border border-indigo-100/50 hover:shadow-md transition-all duration-300">
                      <span className="text-xs uppercase tracking-wider font-bold text-indigo-400">ID</span>
                      <span className="font-bold">{property.propertyId || property.id || property._id || 'N/A'}</span>
                    </div>

                    {property.createdAt && (
                      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800 font-medium border border-orange-100/50 hover:shadow-md transition-all duration-300">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">Lasoo dhigay {formatListingDate(property.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Stats */}
                <div className={`grid gap-4 ${property.status === 'For Sale' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {/* For Sale properties: Show Sharciga and Cabbirka instead of QOL/Suuli */}
                  {property.status === 'For Sale' ? (
                    <>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-16 h-16 md:w-12 md:h-12 flex items-center justify-center mx-auto mb-2">
                          <img
                            src="/icons/sharci.gif"
                            alt="Document"
                            className="w-12 h-12 md:w-8 md:h-8 object-contain"
                          />
                        </div>
                        <div className="text-sm text-blue-800 mb-1 font-bold">Sharciga</div>
                        <div className="text-lg font-bold text-slate-900">{property.documentType || 'Siyaad Barre'}</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-20 h-20 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2">
                          <img
                            src="/icons/ruler2.gif"
                            alt="Measurement"
                            className="w-16 h-16 md:w-10 md:h-10 object-contain"
                          />
                        </div>
                        <div className="text-sm text-blue-800 mb-1 font-bold">Cabbirka</div>
                        <div className="text-xl font-bold text-slate-900">{property.measurement || 'N/A'}</div>
                      </div>
                    </>
                  ) : (
                    /* For Rent properties: Show QOL and Suuli only if values > 0 */
                    <>
                      {property.beds > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-16 h-16 md:w-12 md:h-12 flex items-center justify-center mx-auto mb-2">
                            <img
                              src="/icons/bed.png"
                              alt="Bed"
                              className="w-10 h-10 md:w-7 md:h-7 object-contain"
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.beds}</div>
                          <div className="text-sm text-blue-800 font-bold">Qol</div>
                        </div>
                      )}
                      {property.baths > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-20 h-20 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2">
                            <video
                              src="/icons/shower1.mp4"
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-12 h-12 md:w-8 md:h-8 object-contain mix-blend-multiply"
                              style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.baths}</div>
                          <div className="text-sm text-blue-800 font-bold">Suuli</div>
                        </div>
                      )}
                    </>
                  )}

                  {/* For Sale properties: Show QOL and Suuli only if values > 0 */}
                  {property.status === 'For Sale' && (
                    <>
                      {property.beds > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-16 h-16 md:w-12 md:h-12 flex items-center justify-center mx-auto mb-2">
                            <img
                              src="/icons/bed.png"
                              alt="Bed"
                              className="w-10 h-10 md:w-7 md:h-7 object-contain"
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.beds}</div>
                          <div className="text-sm text-blue-800 font-bold">Qol</div>
                        </div>
                      )}
                      {property.baths > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-20 h-20 md:w-14 md:h-14 flex items-center justify-center mx-auto mb-2">
                            <video
                              src="/icons/shower1.mp4"
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-12 h-12 md:w-8 md:h-8 object-contain mix-blend-multiply"
                              style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.baths}</div>
                          <div className="text-sm text-blue-800 font-bold">Suuli</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Description - Only show if description exists and is not empty */}
                {property.description && property.description.trim() && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-serif font-bold text-slate-900">Faah-Faahin</h3>
                    <p className="text-slate-700 leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Agent Card */}
                <motion.div
                  className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  animate={{
                    boxShadow: [
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 6
                  }}
                >
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          className="flex items-center justify-center"
                          animate={{
                            rotate: [0, -5, 5, -5, 0],
                            scale: [1, 1.05, 1, 1.05, 1],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 4
                          }}
                        >
                          <img
                            src="/icons/header.webp"
                            alt="Contact"
                            className="w-7 h-7 md:w-5 md:h-5 object-contain"
                          />
                        </motion.div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            LAXIRIIR WAKIILKEENA{' '}
                            <span
                              className="transition-colors underline decoration-white/30 hover:decoration-white/60 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent font-bold cursor-pointer hover:text-blue-100"
                              onClick={viewAgentSource}
                              title="View agent profile"
                            >
                              {capitalizeName(property.agent?.name || 'Agent')}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-white text-xs font-bold">👤</span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Content */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div
                        className="relative group cursor-pointer"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Extract agentId properly - ensure it's a string
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
                            agentId = property.agent?.id;
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

                          // Get agent slug for URL-friendly navigation
                          try {
                            const agentName = property.agent?.name || '';
                            const response = await fetch(`/api/agents/slug?agentId=${encodeURIComponent(agentId)}&agentName=${encodeURIComponent(agentName)}`);
                            if (response.ok) {
                              const result = await response.json();
                              if (result.success && result.slug) {
                                const agentUrl = `/agent/${encodeURIComponent(result.slug)}`;
                                console.log('🔍 PropertyDetail: Agent clicked, navigating to:', agentUrl);
                                if (typeof window !== 'undefined') {
                                  window.location.href = agentUrl;
                                }
                                return;
                              }
                            }
                          } catch (error) {
                            console.warn('⚠️ Could not get agent slug, using ID as fallback:', error);
                          }
                          // Fallback to ID if slug generation fails
                          const agentUrl = `/agent/${encodeURIComponent(agentId)}`;
                          if (typeof window !== 'undefined') {
                            window.location.href = agentUrl;
                          }
                        }}
                        title="View agent profile"
                        role="button"
                        tabIndex={0}
                      >
                        <div className="relative">
                          {/* Decorative outer circle */}
                          <motion.div
                            className="absolute -inset-2 rounded-full bg-white opacity-70 blur-sm"
                            animate={{
                              rotate: 360,
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              rotate: {
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                              },
                              scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }
                            }}
                          ></motion.div>

                          {/* Main profile circle */}
                          <div className="relative w-20 h-20 rounded-full p-1 transition-all duration-300 bg-white">
                            <img
                              src={property.agent?.image || (property.agent?.name?.toLowerCase().includes('kobac') ? DEFAULT_AVATAR_URL : AGENT_AVATAR_URL)}
                              alt={capitalizeName(property.agent?.name || 'Agent')}
                              className={`w-full h-full border-2 border-white shadow-md ${(property.agent?.name?.toLowerCase().includes('kobac real estate') || property.agent?.name?.toLowerCase().includes('kobac real')) ? 'rounded-full object-contain' : 'rounded-full object-cover'}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = property.agent?.name?.toLowerCase().includes('kobac') ? DEFAULT_AVATAR_URL : AGENT_AVATAR_URL;
                              }}
                              style={{ pointerEvents: 'none' }}
                            />
                          </div>
                        </div>
                        <div className="absolute -top-1 -right-1 bg-white text-blue-600 p-1.5 md:p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                          <ExternalLink className="w-3 h-3 md:w-2.5 md:h-2.5" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-nowrap">
                          <div className="flex items-center gap-1 flex-nowrap min-w-0">
                            <h3
                              className="text-xl font-bold text-slate-800 transition-colors cursor-pointer hover:text-blue-600 whitespace-nowrap"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const agentId = property.agentId || property.agent?.id;
                                console.log('🔍 PropertyDetail: Agent name clicked, ID:', agentId);
                                if (agentId && typeof window !== 'undefined') {
                                  console.log('🌐 Navigating to:', `/agent/${agentId}`);
                                  window.location.href = `/agent/${agentId}`;
                                }
                              }}
                              title="View agent profile"
                              role="button"
                              tabIndex={0}
                            >
                              {capitalizeName(property.agent?.name || 'Agent')}
                            </h3>
                            {(property.agent?.name?.toLowerCase().includes('kobac real estate') ||
                              property.agent?.name?.toLowerCase().includes('kobac real')) && (
                                <div className="flex items-center justify-center w-4 h-4 rounded-full shadow-lg border flex-shrink-0" style={{ backgroundColor: '#1877F2', borderColor: '#1877F2' }}>
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="text-sm text-slate-500 font-medium">
                            Mogadishu - Somalia
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Contact Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          if (displayPhone) {
                            // Clean the phone number for tel: link and format with 061
                            const cleanPhone = displayPhone.replace(/\D/g, '');
                            // Handle 252 prefix if present, otherwise assume it needs standard 061 check/format
                            // If it's our hardcoded number, it's just 061...

                            let finalPhoneForLink = cleanPhone;
                            if (cleanPhone.startsWith('252')) {
                              finalPhoneForLink = cleanPhone;
                            } else if (!cleanPhone.startsWith('0')) {
                              finalPhoneForLink = `0${cleanPhone}`;
                            }

                            // Specific fix for the hardcoded number or generic handling
                            if (cleanPhone === '0610251014' || cleanPhone === '610251014') {
                              finalPhoneForLink = '0610251014';
                            } else if (cleanPhone.startsWith('2526')) {
                              finalPhoneForLink = `061${cleanPhone.substring(5)}`;
                            } else if (!cleanPhone.startsWith('061') && cleanPhone.length >= 9) {
                              // Fallback formatting closer to original logic
                              finalPhoneForLink = `061${cleanPhone.replace(/^0+/, '')}`;
                            }

                            // Revert to the exact original logic for the agent phone to be safe, but applied to displayPhone
                            // Original: props.agent.phone.replace(/\D/g, '') -> check 2526 -> etc
                            const cleanInput = displayPhone.replace(/\D/g, '');
                            const formattedEx = cleanInput.startsWith('2526') ? `061${cleanInput.substring(5)}` : (cleanInput.length === 9 && !cleanInput.startsWith('0') ? `0${cleanInput}` : cleanInput);

                            window.location.href = `tel:${formattedEx}`;
                          }
                        }}
                        className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, -3, 3, -3, 0],
                            scale: [1, 1.08, 1, 1.08, 1],
                            filter: [
                              "drop-shadow(0 0 0 rgba(59, 130, 246, 0))",
                              "drop-shadow(0 0 4px rgba(59, 130, 246, 0.3))",
                              "drop-shadow(0 0 0 rgba(59, 130, 246, 0))"
                            ]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 3.5
                          }}
                          className="flex items-center justify-center bg-transparent"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <img
                            src="/icons/header.webp"
                            alt="Contact"
                            className="w-8 h-8 md:w-6 md:h-6 object-contain group-hover:scale-110 transition-transform"
                          />
                        </motion.div>
                        <span>{displayLabel}</span>
                      </button>

                      <button
                        onClick={() => {
                          window.open('https://wa.me/252610251014', '_blank');
                        }}
                        className="w-full bg-white border-2 border-green-200 hover:bg-green-50 text-green-700 py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, -5, 5, -5, 0],
                            scale: [1, 1.1, 1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 3
                          }}
                          className="flex items-center justify-center"
                        >
                          <video
                            src="/icons/whatsapp.webm"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-8 h-8 md:w-6 md:h-6 object-contain"
                          />
                        </motion.div>
                        <span>WhatsApp Now</span>
                      </button>


                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-green-100">
                      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Available 24/7</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>Quick Response</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Features and Amenities Section */}
        {(property.features?.length > 0 || property.amenities?.length > 0) && (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
              >
                {/* Features Section */}
                {property.features?.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-blue-600" />
                      Property Features
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {property.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <Home className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-center">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities Section */}
                {property.amenities?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-green-600" />
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {property.amenities.map((amenity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (property.features?.length || 0) * 0.1 + index * 0.1, duration: 0.3 }}
                          className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <Award className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-xs font-medium text-center">{amenity}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Property Recommendations - Temporarily Disabled
        {property.district && (
          <>
            {console.log('🔍 PropertyDetail: Rendering recommendations for district:', property.district)}
            <PropertyRecommendations
              currentProperty={{
                _id: property._id,
                propertyId: property.propertyId,
                district: property.district
              }}
              onPropertyClick={(recommendedProperty) => {
                // Use the onPropertyClick prop if provided, otherwise fallback to custom event
                if (onPropertyClick) {
                  onPropertyClick(recommendedProperty)
                } else {
                  // Fallback: close current detail and dispatch event
                  onClose()
                  // Small delay to allow modal to close before opening new one
                  setTimeout(() => {
                    // Trigger the property click event for the recommended property
                    // This will be handled by the parent component
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('propertyClick', {
                        detail: recommendedProperty
                      })
                      window.dispatchEvent(event)
                    }
                  }, 300)
                }
              }}
            />
          </>
        )}
        */}
      </div>
    </div>
  )
}
