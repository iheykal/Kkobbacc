'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bed, 
  Bath, 
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
  Search,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { DEFAULT_AVATAR_URL, resolveMeasurementValue } from '@/lib/utils'
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver'
import EnhancedImageGallery from '@/components/ui/EnhancedImageGallery'

interface Property {
  _id: string
  propertyId: number
  title: string
  location: string
  district: string
  price: number
  beds: number
  baths: number
  sqft: number
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
  thumbnailImage: string
  images: string[]
  viewCount: number
  agentId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    avatar?: string
    licenseNumber?: string
  }
  agent: {
    name: string
    phone: string
    image: string
    rating: number
  }
  featured: boolean
  deletionStatus: 'active' | 'pending_deletion' | 'deleted'
  deletionRequestedAt?: Date
  deletionRequestedBy?: string
  deletionConfirmedAt?: Date
  deletionConfirmedBy?: string
  createdAt: Date
  updatedAt: Date
}

export default function PropertySearch() {
  const [propertyId, setPropertyId] = useState('')
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4/5)

  // Function to get agent's first name
  const getAgentFirstName = () => {
    if (!property?.agentId?.firstName) return 'Agent'
    return (property.agentId as any).firstName
  }

  const formatPrice = (price: number, listingType?: string) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    
    // Add "/Bishii" (monthly in Somali) for rent properties
    if (listingType === 'rent') {
      return `${formattedPrice}<span class="text-xs font-light text-gray-500 italic">/Bishii</span>`
    }
    
    return formattedPrice
  }

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const capitalizeName = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  const formatListingDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!propertyId.trim()) {
      setError('Please enter a property ID')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setProperty(null)
      setSelectedImage(0)

      const response = await fetch(`/api/admin/search-property?propertyId=${propertyId.trim()}`, {
        credentials: 'include'
      })

      const result = await response.json()

      if (result.success) {
        setProperty(result.data)
      } else {
        setError(result.error || 'Failed to find property')
      }
    } catch (error) {
      console.error('Error searching property:', error)
      setError('Failed to search property')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (index: number) => {
    setSelectedImage(index)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  // Function to calculate and set image aspect ratio
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget
    const aspectRatio = img.naturalWidth / img.naturalHeight
    setImageAspectRatio(aspectRatio)
  }

  // Swipe functionality
  const minSwipeDistance = 30

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !property) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    const totalImages = getAllImageUrls(property).length

    if (isLeftSwipe) {
      handleImageChange(selectedImage < totalImages - 1 ? selectedImage + 1 : 0)
    }
    if (isRightSwipe) {
      handleImageChange(selectedImage > 0 ? selectedImage - 1 : totalImages - 1)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Search Property by ID
        </h3>
        <p className="text-gray-600">
          Enter a property ID to view detailed information
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property ID</label>
              <input
                type="number"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="Enter Property ID (e.g., 1001, 2005, 3002...)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {loading ? 'Searching...' : 'Search Property'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Property Details - Matching Main UI Design */}
      {property && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              
              {/* Left Side - Enhanced Property Images */}
              <div className="space-y-6">
                <EnhancedImageGallery
                  property={property}
                  className="w-full"
                  showThumbnails={true}
                  showNavigation={true}
                  showWatermark={true}
                  watermarkPosition="center"
                  watermarkSize="large"
                  thumbnailSize="medium"
                  thumbnailLayout="grid"
                  enableTouchGestures={true}
                  enableKeyboardNavigation={true}
                  maintainAspectRatio={true}
                />
              </div>

              {/* Right Side - Property Details */}
              <div className="space-y-6">
                {/* Title & Price */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-serif font-bold text-slate-900">
                      {property.title}
                    </h1>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ID: {property.propertyId}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <img 
                      src="/icons/adress.png" 
                      alt="Location" 
                      className="w-5 h-5 object-contain"
                    />
                    <span>{property.location}</span>
                  </div>
                  <div 
                    className="text-4xl font-bold text-green-600"
                    dangerouslySetInnerHTML={{ __html: formatPrice(property.price, property.listingType) }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="w-5 h-5" />
                      <span>Lasoo dhigay {formatListingDate(property.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 bg-blue-50 px-3 py-1 rounded-full">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">
                        {property.viewCount || 0} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* For Sale properties: Show Sharciga instead of QOL/Suuli */}
                  {property.status === 'For Sale' ? (
                    <>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                          <img 
                            src="/icons/sharci.gif" 
                            alt="Document" 
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                        <div className="text-sm text-blue-800 mb-1 font-bold">Sharciga</div>
                        <div className="text-lg font-bold text-slate-900">{property.documentType || 'Siyaad Barre'}</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-2">
                          <img 
                            src="/icons/ruler2.gif" 
                            alt="Measurement" 
                            className="w-14 h-14 object-contain"
                          />
                        </div>
                        <div className="text-sm text-blue-800 mb-1 font-bold">Cabbirka</div>
                        <div className="text-xl font-bold text-slate-900">
                          {resolveMeasurementValue(property.measurement, property.sqft, property.lotSize)}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* For Rent properties: Show QOL and Suuli only if values > 0 */
                    <>
                      {property.beds > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-2">
                            <img 
                              src="/icons/bed.png" 
                              alt="Bed" 
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.beds}</div>
                          <div className="text-sm text-blue-800">Qol</div>
                        </div>
                      )}
                      
                      {property.baths > 0 && (
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-2">
                            <video 
                              src="/icons/shower1.mp4" 
                              autoPlay 
                              loop 
                              muted 
                              playsInline
                              className="w-10 h-10 object-contain mix-blend-multiply"
                              style={{ filter: 'contrast(1.2) brightness(1.1)' }}
                            />
                          </div>
                          <div className="text-xl font-bold text-slate-900">{property.baths}</div>
                          <div className="text-sm text-blue-800">Suuli</div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-xl font-serif font-bold text-slate-900">Faah-Faahin</h3>
                  <p className="text-slate-700 leading-relaxed">{property.description}</p>
                </div>

                {/* Agent Card */}
                <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            LAXIRIIR WAKIILKEENA{' '}
                            <span className="cursor-pointer hover:text-blue-100 transition-colors underline decoration-white/30 hover:decoration-white/60 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent font-bold">
                              {capitalizeName(property.agent?.name || 'Agent')}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">👤</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agent Content */}
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative cursor-pointer group">
                        <div className="w-20 h-20 rounded-full p-1 bg-white border-2 border-gray-200 transition-all duration-300">
                          <img
                            src={property.agent?.image || DEFAULT_AVATAR_URL}
                            alt={capitalizeName(property.agent?.name || 'Agent')}
                            className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = DEFAULT_AVATAR_URL;
                            }}
                          />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-white text-blue-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors">
                                                      {capitalizeName(property.agent?.name || 'Agent')}
                        </h3>
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-200">
                            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                            Wakiilka Kobac Real Estate
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          <span>Professional Real Estate Services</span>
                        </div>
                        {property.agentId?.email && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600 mt-2">
                            <Mail className="w-4 h-4" />
                            <span>{(property.agentId as any).email}</span>
                          </div>
                        )}
                        {property.agentId?.licenseNumber && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">License: {(property.agentId as any).licenseNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact Buttons */}
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          if (property.agent?.phone) {
                            // Clean the phone number for tel: link and format with 061
                            const cleanPhone = property.agent.phone.replace(/\D/g, '');
                            const formattedPhone = cleanPhone.startsWith('2526') ? `061${cleanPhone.substring(5)}` : `061${cleanPhone}`;
                            const phoneLink = `tel:${formattedPhone}`;
                            window.location.href = phoneLink;
                          }
                        }}
                        className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
                      >
                        <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{property.agent?.phone ? formatPhoneNumber(property.agent.phone) : 'Contact Agent'}</span>
                      </button>
                      
                      <button className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 group">
                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Profile-ka {getAgentFirstName()}</span>
                      </button>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-blue-100">
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
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
