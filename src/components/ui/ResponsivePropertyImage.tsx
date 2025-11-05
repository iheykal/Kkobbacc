'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getPrimaryImageUrl } from '@/lib/imageUrlResolver'

interface ResponsivePropertyImageProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  alt: string
  className?: string
  showWatermark?: boolean
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  watermarkSize?: 'small' | 'medium' | 'large'
  index?: number
  onError?: (error: string) => void
}

export const ResponsivePropertyImage: React.FC<ResponsivePropertyImageProps> = ({
  property,
  alt,
  className = '',
  showWatermark = true,
  watermarkPosition = 'center',
  watermarkSize = 'medium',
  index = 0,
  onError
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Watermark size classes
  const watermarkSizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  }

  // Watermark position classes
  const watermarkPositionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }

  // Get image URL
  useEffect(() => {
    const url = getPrimaryImageUrl(property)
    setImageUrl(url)
  }, [property])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement
    const aspectRatio = img.naturalWidth / img.naturalHeight
    setImageAspectRatio(aspectRatio)
    setIsLoading(false)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('ResponsivePropertyImage: Image failed to load:', imageUrl)
    setImageError(true)
    setIsLoading(false)
    
    if (onError) {
      onError(`Failed to load image: ${imageUrl}`)
    }
  }

  // If image failed to load, show placeholder
  if (imageError || !imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-100">
          <div className="w-16 h-16 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs text-center px-2">No Image</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Main Property Image */}
      <motion.img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-contain object-center"
        style={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          // Ensure the image maintains its aspect ratio and shows fully
          minHeight: '100%',
          minWidth: '100%'
        }}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      {/* Company Logo Watermark */}
      {showWatermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermarkPosition]} z-10 pointer-events-none`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className={`${watermarkSizeClasses[watermarkSize]} relative`}>
            {/* Company Logo */}
            <img
              src="/icons/header.png"
              alt="Kobac Company Logo"
              className="w-full h-full object-contain"
              style={{
                opacity: 0.7,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) brightness(1.3) contrast(1.2)'
              }}
              loading="lazy"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}
