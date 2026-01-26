'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PropertyImage from './PropertyImage'

interface PropertyImageWithWatermarkProps {
  src?: string // Made optional to support property-based image resolution
  alt: string
  className?: string
  style?: React.CSSProperties
  showWatermark?: boolean
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  watermarkSize?: 'small' | 'medium' | 'large'
  property?: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  index?: number; // Add index prop to specify which image to show
}

export const PropertyImageWithWatermarkFixed: React.FC<PropertyImageWithWatermarkProps> = ({
  src,
  alt,
  className = '',
  style,
  showWatermark = true,
  watermarkPosition = 'center',
  watermarkSize = 'medium',
  property,
  index = 0 // Default to 0 for backward compatibility
}) => {
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

  return (
    <div className={`relative ${className} flex items-center justify-center w-full h-full overflow-hidden`} style={{ minHeight: '200px' }}>
      {/* Main Property Image */}
      {property ? (
        <PropertyImage
          property={property}
          alt={alt}
          className="w-full h-full"
          style={style}
          loading="lazy"
          index={index} // Pass the index to PropertyImage
          onError={(error) => {
            console.log(`🖼️ Property image at index ${index} failed to load:`, error);
          }}
        />
      ) : (
        <motion.img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
          style={{
            imageRendering: 'auto',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)'
          }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
            opacity: { duration: 0.6 },
            scale: { duration: 0.8 }
          }}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.log('🖼️ Image failed to load:', src);
            // Don't use fallback images - show error state
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('🖼️ Image loaded successfully:', src);
          }}
        />
      )}

      {/* Company Logo Watermark */}
      {showWatermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermarkPosition]} z-10 pointer-events-none`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
            opacity: { duration: 0.8 },
            scale: { duration: 1.0 }
          }}
        >
          <div className={`${watermarkSizeClasses[watermarkSize]} relative opacity-70`}>
            {/* Company Logo */}
            <img
              src="/icons/newlogo.png"
              alt="Kobac Company Logo"
              className="max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-500"
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
