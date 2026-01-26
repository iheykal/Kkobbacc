'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MediaItem } from './MediaItem';
import { FlexibleImage } from './FlexibleImage';

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

    // Preload images with priority hints for faster loading
    // Preload only the first image with high priority
    useEffect(() => {
        if (images.length === 0) return;

        // Preload first image with high priority using link rel="preload"
        if (images[0] && !preloadedImagesRef.current.has(images[0])) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = images[0];
            link.setAttribute('fetchpriority', 'high');
            document.head.appendChild(link);
            preloadedImagesRef.current.add(images[0]);
        }
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

        // Preload adjacent images with priority
        const preloadImageWithPriority = (index: number, priority: 'high' | 'low' = 'low') => {
            if (index >= 0 && index < images.length) {
                const url = images[index];
                if (!preloadedImagesRef.current.has(url)) {
                    const img = new Image();
                    img.fetchPriority = priority;
                    img.src = url;
                    preloadedImagesRef.current.add(url);
                }
            }
        };

        // Preload next image (higher priority as user is likely to navigate forward)
        const nextIndex = selectedImage < images.length - 1 ? selectedImage + 1 : 0;
        preloadImageWithPriority(nextIndex, 'high');

        // Preload previous image (lower priority)
        const prevIndex = selectedImage > 0 ? selectedImage - 1 : images.length - 1;
        preloadImageWithPriority(prevIndex, 'low');
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
                <MediaItem
                    src={images[selectedImage]}
                    alt={`${altPrefix} - Image ${selectedImage + 1}`}
                    className={className}
                    aspectRatio={aspectRatio}
                    objectFit={objectFit}
                    enableZoom={enableZoom}
                    showLoadingState={true}
                    watermark={watermark}
                    loading={selectedImage === 0 ? "eager" : "lazy"}
                    priority={selectedImage === 0}
                    fetchPriority={selectedImage === 0 ? 'high' : 'auto'}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <motion.button
                            onClick={() =>
                                setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                            }
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-black/10 rounded-full p-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 z-10"
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
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-black/10 rounded-full p-2 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 z-10"
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
                        className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium z-10"
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
                        className="absolute bottom-4 left-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-full transition-all duration-200 z-10"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.94 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                    >
                        {isAutoPlaying ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
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
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-300 ${selectedImage === index
                                ? 'ring-2 ring-blue-500 ring-offset-2'
                                : 'opacity-70 hover:opacity-100'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.94 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: selectedImage === index ? 1 : 0.7, x: 0 }}
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

export default PropertyImageGallery;
