'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedPropertyImage from './EnhancedPropertyImage';

interface EnhancedThumbnailNavigationProps {
  property: {
    thumbnailImage?: string;
    images?: string[];
    image?: string;
    title?: string;
  };
  selectedImage: number;
  onImageChange: (index: number) => void;
  className?: string;
  thumbnailSize?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'grid' | 'flexible';
  showActiveIndicator?: boolean;
  enableAnimations?: boolean;
}

/**
 * Enhanced thumbnail navigation component with improved layout,
 * visual feedback, and responsive design
 */
export default function EnhancedThumbnailNavigation({
  property,
  selectedImage,
  onImageChange,
  className = '',
  thumbnailSize = 'medium',
  layout = 'flexible',
  showActiveIndicator = true,
  enableAnimations = true
}: EnhancedThumbnailNavigationProps) {
  const { allImageUrls } = useEnhancedPropertyImages(property);

  // Thumbnail size configurations
  const thumbnailSizeClasses = {
    small: {
      container: 'w-12 h-12',
      gap: 'gap-1.5',
      text: 'text-xs'
    },
    medium: {
      container: 'w-16 h-16',
      gap: 'gap-2',
      text: 'text-sm'
    },
    large: {
      container: 'w-20 h-20',
      gap: 'gap-3',
      text: 'text-base'
    }
  };

  // Layout configurations
  const layoutClasses = {
    horizontal: 'flex flex-nowrap overflow-x-auto scrollbar-hide',
    grid: 'grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8',
    flexible: 'flex flex-wrap justify-center'
  };

  const currentSize = thumbnailSizeClasses[thumbnailSize];
  const currentLayout = layoutClasses[layout];

  if (allImageUrls.length <= 1) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Thumbnail Container */}
      <div className={`${currentLayout} ${currentSize.gap} p-2`}>
        <AnimatePresence>
          {allImageUrls.map((imageUrl: string, index: number) => {
            const isActive = index === selectedImage;
            
            return (
              <motion.button
                key={index}
                onClick={() => onImageChange(index)}
                className={`${currentSize.container} relative rounded-lg overflow-hidden border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isActive 
                    ? 'border-blue-500 ring-2 ring-blue-300 shadow-lg scale-105' 
                    : 'border-transparent hover:border-gray-300 hover:scale-105 hover:shadow-md'
                }`}
                initial={enableAnimations ? { opacity: 0, scale: 0.8 } : undefined}
                animate={enableAnimations ? { opacity: 1, scale: isActive ? 1.05 : 1 } : undefined}
                exit={enableAnimations ? { opacity: 0, scale: 0.8 } : undefined}
                transition={enableAnimations ? { duration: 0.2, delay: index * 0.05 } : {}}
                whileHover={enableAnimations ? { scale: 1.05 } : {}}
                whileTap={enableAnimations ? { scale: 0.95 } : {}}
              >
                {/* Thumbnail Image */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <EnhancedPropertyImage
                    property={property}
                    index={index}
                    className="w-full h-full"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    alt={`${property.title} - Thumbnail ${index + 1}`}
                    maintainAspectRatio={true}
                    showWatermark={false}
                  />
                </div>

                {/* Active Indicator */}
                {showActiveIndicator && isActive && (
                  <motion.div
                    className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-lg"
                    initial={enableAnimations ? { opacity: 0, scale: 0.8 } : false}
                    animate={enableAnimations ? { opacity: 1, scale: 1 } : false}
                    transition={enableAnimations ? { duration: 0.2 } : {}}
                  />
                )}

                {/* Hover Overlay */}
                <motion.div
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 rounded-lg"
                  whileHover={enableAnimations ? { backgroundColor: 'rgba(0,0,0,0.1)' } : {}}
                />

                {/* Image Number Badge */}
                <div className={`absolute top-1 right-1 bg-white bg-opacity-90 rounded-full px-1.5 py-0.5 ${currentSize.text} font-medium text-gray-700 shadow-sm`}>
                  {index + 1}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Image Counter */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-600 font-medium">
          {selectedImage + 1} of {allImageUrls.length}
        </span>
      </div>
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
