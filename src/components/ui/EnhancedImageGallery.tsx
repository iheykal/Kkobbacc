'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedPropertyImage from './EnhancedPropertyImage';
import EnhancedThumbnailNavigation from './EnhancedThumbnailNavigation';

interface EnhancedImageGalleryProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  className?: string;
  showThumbnails?: boolean;
  showNavigation?: boolean;
  showWatermark?: boolean;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkSize?: 'small' | 'medium' | 'large';
  thumbnailSize?: 'small' | 'medium' | 'large';
  thumbnailLayout?: 'horizontal' | 'grid' | 'flexible';
  enableTouchGestures?: boolean;
  enableKeyboardNavigation?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  maintainAspectRatio?: boolean;
}

/**
 * Enhanced image gallery component with improved aspect ratio handling,
 * responsive design, and enhanced user interactions
 */
export default function EnhancedImageGallery({
  property,
  className = '',
  showThumbnails = true,
  showNavigation = true,
  showWatermark = true,
  watermarkPosition = 'center',
  watermarkSize = 'large',
  thumbnailSize = 'medium',
  thumbnailLayout = 'flexible',
  enableTouchGestures = true,
  enableKeyboardNavigation = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  maintainAspectRatio = true
}: EnhancedImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4/5);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const { allImageUrls } = useEnhancedPropertyImages(property);

  // Handle image change with smooth transitions
  const handleImageChange = useCallback((index: number) => {
    if (index >= 0 && index < allImageUrls.length) {
      setSelectedImage(index);
      setIsAutoPlaying(false); // Stop auto-play when user interacts
    }
  }, [allImageUrls.length]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    const prevIndex = selectedImage > 0 ? selectedImage - 1 : allImageUrls.length - 1;
    handleImageChange(prevIndex);
  }, [selectedImage, allImageUrls.length, handleImageChange]);

  const goToNext = useCallback(() => {
    const nextIndex = selectedImage < allImageUrls.length - 1 ? selectedImage + 1 : 0;
    handleImageChange(nextIndex);
  }, [selectedImage, allImageUrls.length, handleImageChange]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableTouchGestures) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableTouchGestures) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!enableTouchGestures || touchStart === null || touchEnd === null) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          handleImageChange(0);
          break;
        case 'End':
          e.preventDefault();
          handleImageChange(allImageUrls.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, goToPrevious, goToNext, handleImageChange, allImageUrls.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || allImageUrls.length <= 1) return;

    const interval = setInterval(() => {
      if (isAutoPlaying) {
        goToNext();
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, isAutoPlaying, goToNext, allImageUrls.length]);

  // Calculate responsive aspect ratio
  useEffect(() => {
    const updateAspectRatio = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setImageAspectRatio(4/5); // Mobile: portrait
      } else if (width < 1024) {
        setImageAspectRatio(16/10); // Tablet: landscape
      } else {
        setImageAspectRatio(16/9); // Desktop: wide landscape
      }
    };

    updateAspectRatio();
    window.addEventListener('resize', updateAspectRatio);
    return () => window.removeEventListener('resize', updateAspectRatio);
  }, []);

  if (allImageUrls.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg min-h-[300px]`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No images available</p>
          <p className="text-sm">Images will appear here when uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Main Image Display */}
      <div 
        className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg"
        style={{ aspectRatio: maintainAspectRatio ? imageAspectRatio : 'auto' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(autoPlay)}
      >
        {/* Main Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            className="w-full h-full flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <EnhancedPropertyImage
              property={property}
              index={selectedImage}
              className="w-full h-full"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              alt={`${property.title} - Image ${selectedImage + 1}`}
              maintainAspectRatio={maintainAspectRatio}
              showWatermark={showWatermark}
              watermarkPosition={watermarkPosition}
              watermarkSize={watermarkSize}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {showNavigation && allImageUrls.length > 1 && (
          <>
            <motion.button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <motion.button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </>
        )}

        {/* Image Counter */}
        {allImageUrls.length > 1 && (
          <motion.div
            className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedImage + 1} / {allImageUrls.length}
          </motion.div>
        )}

        {/* Auto-play Indicator */}
        {autoPlay && (
          <motion.button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 left-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
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
      {showThumbnails && allImageUrls.length > 1 && (
        <EnhancedThumbnailNavigation
          property={property}
          selectedImage={selectedImage}
          onImageChange={handleImageChange}
          thumbnailSize={thumbnailSize}
          layout={thumbnailLayout}
          showActiveIndicator={true}
          enableAnimations={true}
        />
      )}
    </div>
  );
}

/**
 * Hook to get property image data with enhanced functionality
 */
function useEnhancedPropertyImages(property: {
  thumbnailImage?: string;
  images?: string[];
  image?: string;
}) {
  const { getAllImageUrls } = require('@/lib/imageUrlResolver');
  const allImageUrls = getAllImageUrls(property);
  
  return {
    allImageUrls,
    hasImages: allImageUrls.length > 0,
    imageCount: allImageUrls.length
  };
}
