'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlexibleImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  fallbackSrc?: string;
  showLoadingState?: boolean;
  enableZoom?: boolean;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape' | number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  maxHeight?: string | number;
  minHeight?: string | number;
  watermark?: {
    src: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    size?: 'small' | 'medium' | 'large';
    opacity?: number;
  };
}

/**
 * FlexibleImage - A responsive image component that maintains aspect ratio
 * and scales to fit containers for both wide and tall images
 */
export const FlexibleImage: React.FC<FlexibleImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  loading = 'lazy',
  priority = false,
  sizes,
  onError,
  onLoad,
  fallbackSrc,
  showLoadingState = true,
  enableZoom = false,
  aspectRatio = 'auto',
  objectFit = 'contain',
  maxHeight,
  minHeight,
  watermark
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackError, setFallbackError] = useState(false);
  const [triedAlternateFormat, setTriedAlternateFormat] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(src);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when src prop changes
  useEffect(() => {
    setDisplayedSrc(src);
    setImageError(false);
    setFallbackError(false);
    setIsLoading(true);
    setTriedAlternateFormat(false);
  }, [src]);

  // Handle image load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    setIsLoading(false);
    
    // Calculate and store natural aspect ratio
    if (img.naturalWidth && img.naturalHeight) {
      const naturalAspectRatio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(naturalAspectRatio);
    } else {
      // If natural dimensions are 0, try to get dimensions from the loaded image
      console.warn('FlexibleImage: Image loaded but naturalWidth/naturalHeight is 0:', {
        src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      });
      
      // Set a default aspect ratio for R2 images that might have loading issues
      setImageAspectRatio(16/9);
    }
    
    if (onLoad) {
      onLoad();
    }
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    console.error('FlexibleImage failed to load:', {
      src: displayedSrc,
      alt,
      error: e,
      imageSrc: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      // Additional debugging info
      currentSrc: img.currentSrc,
      crossOrigin: img.crossOrigin,
      loading: img.loading
    });
    
    // Try alternate format (.webp) once if original ends with common raster extensions
    const tryWebpFallback = () => {
      // Handles both direct R2 URL and proxied /api/image-proxy?url=...
      const buildWebpUrl = (input: string) => {
        try {
          const isProxy = input.includes('/api/image-proxy?url=');
          if (isProxy) {
            const u = new URL(input, window.location.origin);
            const target = u.searchParams.get('url') || '';
            const webpTarget = target.replace(/\.(jpg|jpeg|png)(?=$|\?)/i, '.webp');
            if (webpTarget !== target) {
              u.searchParams.set('url', webpTarget);
              return u.pathname + '?' + u.searchParams.toString();
            }
            return input;
          }
          return input.replace(/\.(jpg|jpeg|png)(?=$|\?)/i, '.webp');
        } catch {
          return input.replace(/\.(jpg|jpeg|png)(?=$|\?)/i, '.webp');
        }
      };

      const nextSrc = buildWebpUrl(displayedSrc);
      if (nextSrc !== displayedSrc) {
        setTriedAlternateFormat(true);
        setIsLoading(true);
        setImageError(false);
        setDisplayedSrc(nextSrc);
        return true;
      }
      return false;
    };

    if (!triedAlternateFormat && /\.(jpg|jpeg|png)(?=$|\?)/i.test(displayedSrc) || (!triedAlternateFormat && displayedSrc.includes('%2Ejpg'))) {
      const attempted = tryWebpFallback();
      if (attempted) {
        if (onError) {
          onError(`Primary image failed, retrying as WebP: ${displayedSrc}`);
        }
        return;
      }
    }

    setImageError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(`Failed to load image: ${displayedSrc}`);
    }
  };

  // Handle fallback image error
  const handleFallbackError = () => {
    setFallbackError(true);
    setIsLoading(false);
  };

  // Toggle zoom functionality
  const toggleZoom = () => {
    if (enableZoom) {
      setIsZoomed(!isZoomed);
    }
  };

  // Get aspect ratio style
  const getAspectRatioStyle = () => {
    if (aspectRatio === 'auto') {
      return imageAspectRatio ? { aspectRatio: imageAspectRatio.toString() } : {};
    } else if (typeof aspectRatio === 'number') {
      return { aspectRatio: aspectRatio.toString() };
    } else {
      const ratios = {
        square: '1/1',
        video: '16/9',
        portrait: '3/4',
        landscape: '4/3'
      };
      return { aspectRatio: ratios[aspectRatio] };
    }
  };

  // Get object fit class
  const getObjectFitClass = () => {
    const fitClasses = {
      contain: 'object-contain',
      cover: 'object-cover',
      fill: 'object-fill',
      'scale-down': 'object-scale-down'
    };
    return fitClasses[objectFit];
  };

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

  // Container styles
  const containerStyles: React.CSSProperties = {
    ...getAspectRatioStyle(),
    maxHeight: maxHeight || 'none',
    minHeight: minHeight || 'auto'
  };

  // If no image source or error occurred
  if (!src || imageError) {
    if (fallbackError) {
      return (
        <div 
          className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${containerClassName} w-full min-h-[200px]`}
          role="img"
          aria-label={alt || 'Image not available'}
        >
          <div className="text-gray-500 text-sm text-center p-4">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {alt || 'Image not available'}
          </div>
        </div>
      );
    }

    // Show a proper "No Image" placeholder instead of villa-2.webp
    return (
      <div 
        className={`relative ${containerClassName} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}
        style={containerStyles}
      >
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
    <div 
      className={`relative ${containerClassName} flex items-center justify-center overflow-hidden ${
        enableZoom ? 'cursor-zoom-in' : ''
      }`}
      style={containerStyles}
      onClick={toggleZoom}
    >
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && showLoadingState && (
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
        ref={imgRef}
        src={displayedSrc}
        alt={alt}
        loading={loading || 'lazy'}
        sizes={sizes}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`transition-all duration-300 ${
          getObjectFitClass()
        } ${
          aspectRatio === 'auto' 
            ? 'max-w-full max-h-full w-auto h-auto' 
            : 'w-full h-full'
        } ${
          isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
        } ${
          isZoomed ? 'scale-150' : 'scale-100'
        } ${className}`}
        style={{
          ...(aspectRatio === 'auto' && {
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }),
          // Additional styles for better R2 image loading
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ 
          opacity: isLoading ? 0 : 1, 
          scale: isLoading ? 1.05 : (isZoomed ? 1.5 : 1)
        }}
        transition={{ duration: 0.22 }}
      />

      {/* Watermark */}
      {watermark && (
        <motion.div
          className={`absolute ${watermarkPositionClasses[watermark.position || 'center']} z-20 pointer-events-none`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className={`${watermarkSizeClasses[watermark.size || 'medium']} relative`}>
            <img
              src={watermark.src}
              alt="Watermark"
              className="max-w-full max-h-full w-auto h-auto object-contain"
              style={{
                opacity: watermark.opacity || 0.7,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) brightness(1.3) contrast(1.2)'
              }}
              loading="lazy"
            />
          </div>
        </motion.div>
      )}

      {/* Zoom indicator */}
      {enableZoom && (
        <motion.div
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity"
          initial={{ opacity: 0 }}
          animate={{ opacity: isZoomed ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isZoomed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7v4h6v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            )}
          </svg>
        </motion.div>
      )}
    </div>
  );
};

/**
 * PropertyImageGallery - A gallery component using FlexibleImage
 */
interface PropertyImageGalleryProps {
  images: string[];
  altPrefix?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'landscape' | number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  enableZoom?: boolean;
  showThumbnails?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  watermark?: {
    src: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    size?: 'small' | 'medium' | 'large';
    opacity?: number;
  };
}

export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
  altPrefix = 'Property',
  className = '',
  containerClassName = '',
  aspectRatio = 'auto',
  objectFit = 'contain',
  enableZoom = false,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  watermark
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Preload all images when gallery opens
  useEffect(() => {
    if (images.length === 0) return;

    images.forEach((url: string) => {
      if (!preloadedImagesRef.current.has(url)) {
        const img = new Image();
        img.src = url;
        preloadedImagesRef.current.add(url);
      }
    });
  }, [images]);

  // Preload adjacent images when selected image changes
  useEffect(() => {
    if (images.length === 0) return;

    const preloadImage = (index: number) => {
      if (index >= 0 && index < images.length) {
        const url = images[index];
        if (!preloadedImagesRef.current.has(url)) {
          const img = new Image();
          img.src = url;
          preloadedImagesRef.current.add(url);
        }
      }
    };

    // Preload next image
    const nextIndex = selectedImage < images.length - 1 ? selectedImage + 1 : 0;
    preloadImage(nextIndex);

    // Preload previous image
    const prevIndex = selectedImage > 0 ? selectedImage - 1 : images.length - 1;
    preloadImage(prevIndex);
  }, [selectedImage, images]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const interval = setInterval(() => {
      if (isAutoPlaying) {
        setSelectedImage((prev) => (prev + 1) % images.length);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isAutoPlaying, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedImage(selectedImage > 0 ? selectedImage - 1 : images.length - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedImage(selectedImage < images.length - 1 ? selectedImage + 1 : 0);
          break;
        case 'Home':
          e.preventDefault();
          setSelectedImage(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedImage(images.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, images.length]);

  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (images.length === 0) {
    return (
      <div className={`${containerClassName} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg min-h-[300px]`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No images available</p>
          <p className="text-sm text-gray-400 mt-2">Images will be added soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} space-y-4`}>
      {/* Main Image Display */}
      <div 
        className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg w-full flex items-center justify-center"
        style={{
          minHeight: '200px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(autoPlay)}
      >
        <FlexibleImage
          src={images[selectedImage]}
          alt={`${altPrefix} - Image ${selectedImage + 1}`}
          className={className}
          aspectRatio={aspectRatio}
          objectFit={objectFit}
          enableZoom={enableZoom}
          showLoadingState={true}
          watermark={watermark}
          loading="eager"
          priority={true}
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <motion.button
              onClick={() =>
                setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))
              }
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-black/10 rounded-full p-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <motion.button
              onClick={() =>
                setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-black/10 rounded-full p-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <motion.div
            className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {selectedImage + 1} / {images.length}
          </motion.div>
        )}

        {/* Auto-play Controls */}
        {autoPlay && images.length > 1 && (
          <motion.button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 left-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
          >
            {isAutoPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {showThumbnails && images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <motion.button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 ${
                selectedImage === index 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'opacity-70 hover:opacity-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: selectedImage === index ? 1 : 0.7, scale: 1 }}
              transition={{ duration: 0.16 }}
            >
              <FlexibleImage
                src={image}
                alt={`${altPrefix} thumbnail ${index + 1}`}
                aspectRatio="square"
                objectFit="cover"
                className="w-full h-full"
                showLoadingState={false}
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlexibleImage;