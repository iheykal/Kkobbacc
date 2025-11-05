'use client'

import NextImage from 'next/image'
import { useState } from 'react'
import { DEFAULT_AVATAR_URL } from '@/lib/utils'

// Ensure global Image constructor is accessible
declare global {
  interface Window {
    Image: typeof Image
  }
}

interface HybridImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  fallbackSrc?: string
}

export default function HybridImage({ 
  src, 
  alt, 
  width = 400, 
  height = 400, 
  className = '',
  style,
  fallbackSrc = DEFAULT_AVATAR_URL
}: HybridImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
  }

  // For external URLs (like DiceBear), use regular <img> tag
  if (src.includes('api.dicebear.com') || src.startsWith('http')) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        onError={handleError}
      />
    )
  }

  // For local URLs, use Next.js Image component for optimization
  return (
    <NextImage
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={handleError}
    />
  )
}
