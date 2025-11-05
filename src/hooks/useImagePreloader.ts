import { useState, useEffect, useCallback } from 'react'

interface ImagePreloaderOptions {
  images: string[]
  onAllLoaded?: () => void
  onImageLoaded?: (index: number, url: string) => void
  onImageError?: (index: number, url: string) => void
}

interface ImagePreloaderResult {
  loadedImages: boolean[]
  allImagesLoaded: boolean
  loadingProgress: number
  preloadImages: () => void
}

export const useImagePreloader = ({
  images,
  onAllLoaded,
  onImageLoaded,
  onImageError
}: ImagePreloaderOptions): ImagePreloaderResult => {
  const [loadedImages, setLoadedImages] = useState<boolean[]>(new Array(images.length).fill(false))
  const [allImagesLoaded, setAllImagesLoaded] = useState(false)

  const preloadImages = useCallback(() => {
    if (images.length === 0) return

    setLoadedImages(new Array(images.length).fill(false))
    setAllImagesLoaded(false)

    images.forEach((imageUrl, index) => {
      const img = new Image()
      
      img.onload = () => {
        setLoadedImages(prev => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
        
        onImageLoaded?.(index, imageUrl)
        
        // Check if all images are loaded
        setLoadedImages(current => {
          const allLoaded = current.every((loaded, i) => i === index ? true : loaded)
          if (allLoaded) {
            setAllImagesLoaded(true)
            onAllLoaded?.()
          }
          return current
        })
      }
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${imageUrl}`)
        onImageError?.(index, imageUrl)
      }
      
      img.src = imageUrl
    })
  }, [images, onAllLoaded, onImageLoaded, onImageError])

  useEffect(() => {
    preloadImages()
  }, [preloadImages])

  const loadingProgress = images.length > 0 
    ? (loadedImages.filter(Boolean).length / images.length) * 100 
    : 100

  return {
    loadedImages,
    allImagesLoaded,
    loadingProgress,
    preloadImages
  }
}

