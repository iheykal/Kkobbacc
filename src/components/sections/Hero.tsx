'use client'

import React, { useState, useEffect } from 'react'
import { LazyMotionDiv, LazyMotionH1, LazyMotionP } from '@/components/lazy/LazyMotion'
import { Users, Clock, Globe, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import NextImage from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([])
  const { user, isAuthenticated } = useUser()
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }

  // Optimized image loader with WebP priority for better performance
  const createImageLoader = () => {
    const imageNames = [
      'happy-family',
      'villa-2', 
      'yellow-villah',
      'bg-1',
      'haanta-dheer',
      'duwaq'
    ]

    return imageNames.map(name => {
      // Prioritize WebP for better performance, then fall back to other formats
      let primarySrc, fallbacks
      
      if (name === 'haanta-dheer') {
        // haanta-dheer is corrupted in WebP, so try JPG first
        primarySrc = `/icons/${name}.jpg`
        fallbacks = [
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      } else if (name === 'duwaq') {
        // duwaq is JPG, so try JPG first since WebP doesn't exist
        primarySrc = `/icons/${name}.jpg`
        fallbacks = [
          `/icons/${name}.webp`,   // Try WebP as fallback
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      } else {
        // Other images are PNG, so try WebP first, then PNG
        primarySrc = `/icons/${name}.webp`
        fallbacks = [
          `/icons/${name}.png`,    // Try PNG as fallback
          `/icons/${name}.jpg`,    // Try JPG as fallback
          `/icons/${name}.jpeg`,   // Try JPEG as fallback
          `/icons/${name}`,        // No extension fallback
        ]
      }
      
      return {
        src: primarySrc,
        fallbacks: fallbacks,
        alt: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        name: name
      }
    })
  }

  const images = createImageLoader()

  // Initialize images loaded state
  useEffect(() => {
    setImagesLoaded(new Array(images.length).fill(false))
  }, [images.length])

  // Preload images to prevent blinking
  useEffect(() => {
    images.forEach((image, index) => {
      const img = new Image()
      img.onload = () => {
        setImagesLoaded(prev => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }
      img.src = image.src
    })
  }, [images])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <>
      {/* Redirect Animation */}
      <RedirectAnimation {...animationProps} />
      
      <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] overflow-hidden" data-hero-section>
      {/* Background Image Carousel */}
      {images.map((image, index) => {
        const isCurrentImage = index === currentImageIndex
        const isLoaded = imagesLoaded[index]
        
        return (
          <LazyMotionDiv
            key={image.src}
            initial={{ opacity: 0 }}
            animate={{
              opacity: isCurrentImage ? 1 : 0,
              scale: isCurrentImage ? 1 : 1.05
            }}
            transition={{ 
              duration: 1.2, 
              ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for smoother transition
              opacity: { duration: 1.2 },
              scale: { duration: 1.5 }
            }}
            className="absolute inset-0"
            style={{
              zIndex: isCurrentImage ? 2 : 1
            }}
          >
            {/* Loading placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 animate-pulse" />
            )}
            
            <NextImage 
              src={image.src} 
              alt={image.alt} 
              fill
              className={`object-cover transition-opacity duration-500 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "low"}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              quality={index === 0 ? 75 : 70}
              onError={(e) => {
                console.log(`Image failed to load: ${image.src} for ${image.name}`)
                // Don't try to manipulate the image source in onError
                // This can cause issues with Next.js Image component
              }}
              onLoad={() => {
                console.log(`✅ Successfully loaded: ${image.src} for ${image.name}`)
                setImagesLoaded(prev => {
                  const newState = [...prev]
                  newState[index] = true
                  return newState
                })
              }}
            />
          </LazyMotionDiv>
        )
      })}



      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-4">
          <LazyMotionH1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3"
          >
            Find Your Dream Home
          </LazyMotionH1>
          
          <LazyMotionP 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg mb-4 md:mb-6 text-white/90"
          >
            Discover luxury properties in the most desirable locations
          </LazyMotionP>
          
          {/* Mobile Agent Dashboard Button */}
          {isAuthenticated && user?.role === 'agent' && (
            <LazyMotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="sm:hidden"
            >
              <Button 
                onClick={handleAgentDashboardClick}
                variant="secondary" 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl border-0 transition-all duration-300 hover:scale-105"
              >
                <User className="w-5 h-5 mr-2" />
                Agent Dashboard
              </Button>
            </LazyMotionDiv>
          )}
        </div>
      </div>
    </section>
    </>
  )
}

export default Hero
