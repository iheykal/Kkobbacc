'use client';

import { useState } from 'react';
import { getPrimaryImageUrl, getAllImageUrls } from '@/lib/imageUrlResolver';
import { addPropertyCacheBuster } from '@/lib/cacheBuster';

interface PropertyImageProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
    updatedAt?: Date | string;
    _id?: string;
    propertyId?: number;
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
  enableCacheBusting?: boolean;
}

/**
 * PropertyImage component that displays property images from Cloudflare R2
 * Handles missing images gracefully with proper fallbacks
 */
export default function PropertyImage({
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
  enableCacheBusting = true
}: PropertyImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState(false);

  const getImageUrl = () => {
    let imageUrl: string | null = null;
    
    if (index === 0 || !property.images?.length) {
      imageUrl = getPrimaryImageUrl(property);
    } else {
      const imageIndex = index - 1;
      if (property.images && imageIndex < property.images.length) {
        imageUrl = property.images[imageIndex];
      } else {
        imageUrl = getPrimaryImageUrl(property);
      }
    }
    
    // Add cache busting if enabled and URL exists
    if (imageUrl && enableCacheBusting) {
      imageUrl = addPropertyCacheBuster(imageUrl, property);
    }
    
    return imageUrl;
  };
  
  const imageUrl = getImageUrl();
  
  if (!imageUrl || imageError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    // Show a proper "No Image" placeholder instead of villa-2.webp
    return (
      <div 
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className} w-full`}
        role="img"
        aria-label={alt || property.title || 'Property image not available'}
      >
        <div className="text-center p-4">
          <div className="w-16 h-16 mb-2 rounded-full bg-gray-300 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No Image Available</p>
        </div>
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error('Property image failed to load:', {
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

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded" />
      )}
      
      <img
        src={imageUrl}
        alt={alt || property.title || 'Property image'}
        loading={loading}
        sizes={sizes}
        style={{
          ...style,
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        }`}
      />
    </div>
  );
}

/**
 * Hook to get property image data
 */
export function usePropertyImages(property: {
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