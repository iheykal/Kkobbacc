'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getWebPPath, supportsWebP, convertToWebP } from '@/lib/webpUtils'

interface WebPImageProps {
  src: string
  alt: string
  webpSrc?: string
  className?: string
  width?: number
  height?: number
  quality?: number
  loading?: 'lazy' | 'eager'
  priority?: boolean
  fill?: boolean
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  fallback?: string
  autoConvert?: boolean
}

export const WebPImage: React.FC<WebPImageProps> = ({
  src,
  alt,
  webpSrc,
  className,
  width,
  height,
  quality = 85,
  loading = 'lazy',
  priority = false,
  fill = false,
  sizes,
  onLoad,
  onError,
  fallback,
  autoConvert = true
}) => {
  const [webpPath, setWebpPath] = useState<string | null>(null)
  const [isWebPSupported, setIsWebPSupported] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Check WebP support
  useEffect(() => {
    setIsWebPSupported(supportsWebP())
  }, [])

  // Auto-convert to WebP if needed
  useEffect(() => {
    if (autoConvert && !webpSrc && !webpPath && !conversionError) {
      const autoWebpPath = getWebPPath(src)
      
      // Check if WebP version already exists
      const checkWebPExists = async () => {
        try {
          const response = await fetch(autoWebpPath, { method: 'HEAD' })
          if (response.ok) {
            setWebpPath(autoWebpPath)
          } else {
            // Convert to WebP
            setIsConverting(true)
            const result = await convertToWebP(src, quality)
            if (result.success && result.webpPath) {
              setWebpPath(result.webpPath)
            } else {
              setConversionError(result.error || 'Conversion failed')
            }
            setIsConverting(false)
          }
        } catch (error) {
          setConversionError('Failed to check WebP availability')
          setIsConverting(false)
        }
      }
      
      checkWebPExists()
    }
  }, [src, webpSrc, webpPath, autoConvert, quality, conversionError])

  // Handle image load
  const handleLoad = useCallback(() => {
    setImageError(false)
    onLoad?.()
  }, [onLoad])

  // Handle image error
  const handleError = useCallback(() => {
    setImageError(true)
    onError?.()
  }, [onError])

  // Determine which image source to use
  const getImageSource = () => {
    if (imageError && fallback) {
      return fallback
    }
    
    if (isWebPSupported && (webpSrc || webpPath)) {
      return webpSrc || webpPath || src
    }
    
    return src
  }

  const imageSource = getImageSource()

  // Show loading state during conversion
  if (isConverting) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-gray-500">Converting to WebP...</div>
        </div>
      </div>
    )
  }

  // Show error state
  if (imageError && !fallback) {
    return (
      <div 
        className={`bg-gray-100 border border-gray-300 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-sm text-gray-500 text-center p-4">
          <div>Image failed to load</div>
          <div className="text-xs mt-1">{alt}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <Image
        src={imageSource}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={className}
        loading={loading}
        priority={priority}
        fill={fill}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        quality={quality}
      />
      
      {/* WebP indicator for development */}
      {process.env.NODE_ENV === 'development' && isWebPSupported && (webpSrc || webpPath) && (
        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
          WebP
        </div>
      )}
      
      {/* Conversion error indicator for development */}
      {process.env.NODE_ENV === 'development' && conversionError && (
        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
          Conv. Error
        </div>
      )}
    </div>
  )
}

export default WebPImage

