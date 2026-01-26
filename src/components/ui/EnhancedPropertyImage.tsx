'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver';

interface EnhancedPropertyImageProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
  fallbackComponent?: React.ReactNode;
  onError?: (error: string) => void;
  index?: number;
  maintainAspectRatio?: boolean;
  showWatermark?: boolean;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkSize?: 'small' | 'medium' | 'large';
}

/**
 * Enhanced PropertyImage component with improved aspect ratio handling,
 * loading states, and visual feedback
 */
export default function EnhancedPropertyImage({
  property,
  alt,
  className = '',
  style,
  loading = 'lazy',
  sizes,
  priority = false,
  fallbackComponent,
  onError,
  index = 0,
  maintainAspectRatio = true,
  showWatermark = false,
  watermarkPosition = 'center',
  watermarkSize = 'medium'
}: EnhancedPropertyImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  const getImageUrl = () => {
    if (index === 0 || !property.images?.length) {
      return getPrimaryImageUrl(property);
    }

    const imageIndex = index - 1;
    if (property.images && imageIndex < property.images.length) {
      return property.images[imageIndex];
    }

    return getPrimaryImageUrl(property);
  };

  const imageUrl = getImageUrl();

  // Watermark size classes
  const watermarkSizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  // Watermark position classes
  const watermarkPositionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    setIsLoading(false);

    // Calculate and store aspect ratio for responsive behavior
    if (maintainAspectRatio && img.naturalWidth && img.naturalHeight) {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(aspectRatio);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Enhanced property image failed to load:', {
      propertyId: property.title,
      imageUrl: imageUrl,
      allImages: getAllImageUrls(property),
      requestedIndex: index,
      src: target.src,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      complete: target.complete,
      isR2Url: imageUrl ? imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com') : false
    });

    setImageError(true);
    setIsLoading(false);

    if (onError) {
      onError(`Failed to load image at index ${index}: ${imageUrl}`);
    }
  };

  // Fallback component for missing images
  if (!imageUrl || imageError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    // Show a proper "No Image" placeholder instead of villa-2.webp
    return (
      <div className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}>
        <div className="text-center p-6">
          <div className="w-20 h-20 mb-3 rounded-full bg-gray-300 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No Image Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden`}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Image */}
      <motion.img
        src={imageUrl}
        alt={alt || property.title || 'Property image'}
        loading={loading || (priority ? 'eager' : 'lazy')}
        sizes={sizes}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        style={{
          ...style,
          ...(maintainAspectRatio && imageAspectRatio ? {
            aspectRatio: imageAspectRatio.toString()
          } : {})
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`transition-all duration-500 ${maintainAspectRatio
            ? 'max-w-full max-h-full w-auto h-auto object-contain'
            : 'w-full h-full object-cover object-center'
          } ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{
          opacity: isLoading ? 0 : 1,
          scale: isLoading ? 1.05 : 1
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Company Logo Watermark */}
      {showWatermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermarkPosition]} z-20 pointer-events-none`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className={`${watermarkSizeClasses[watermarkSize]} relative opacity-70`}>
            <img
              src="/icons/newlogo.png"
              alt="Kobac Company Logo"
              className="max-w-full max-h-full w-auto h-auto object-contain"
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
  );
}

/**
 * Hook to get property image data with enhanced functionality
 */
export function useEnhancedPropertyImages(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}) {
  const primaryImageUrl = getPrimaryImageUrl(property);
  const allImageUrls = getAllImageUrls(property);

  return {
    primaryImageUrl,
    allImageUrls,
    hasImages: allImageUrls.length > 0,
    imageCount: allImageUrls.length
  };
}
