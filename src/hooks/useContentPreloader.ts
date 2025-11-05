import { useState, useCallback, useRef } from 'react'

interface UseContentPreloaderOptions {
  preloadThreshold?: number // Distance from bottom to start preloading
  maxPreloadItems?: number // Maximum items to preload
  preloadDelay?: number // Delay before starting preload
}

export const useContentPreloader = ({
  preloadThreshold = 200,
  maxPreloadItems = 10,
  preloadDelay = 300
}: UseContentPreloaderOptions = {}) => {
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadedCount, setPreloadedCount] = useState(0)
  const [hasMoreContent, setHasMoreContent] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPreloadingRef = useRef(false)

  const shouldPreload = useCallback((scrollY: number, scrollHeight: number, windowHeight: number) => {
    const distanceFromBottom = scrollHeight - scrollY - windowHeight
    return distanceFromBottom < preloadThreshold && hasMoreContent && !isPreloadingRef.current
  }, [preloadThreshold, hasMoreContent])

  const preloadContent = useCallback(async () => {
    if (isPreloadingRef.current || !hasMoreContent) return

    isPreloadingRef.current = true
    setIsPreloading(true)
    
    console.log('🔄 Content Preloader: Starting preload...')
    
    try {
      // Simulate content loading (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update preloaded count
      setPreloadedCount(prev => {
        const newCount = prev + maxPreloadItems
        console.log(`✅ Content Preloader: Preloaded ${newCount} items`)
        return newCount
      })
      
      // Check if we've reached the end
      if (preloadedCount >= 50) { // Example limit
        setHasMoreContent(false)
        console.log('🏁 Content Preloader: Reached end of content')
      }
      
    } catch (error) {
      console.error('❌ Content Preloader: Error preloading content:', error)
    } finally {
      setIsPreloading(false)
      isPreloadingRef.current = false
    }
  }, [maxPreloadItems, preloadedCount, hasMoreContent])

  const triggerPreload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      preloadContent()
    }, preloadDelay)
  }, [preloadContent, preloadDelay])

  const resetPreloader = useCallback(() => {
    setIsPreloading(false)
    setPreloadedCount(0)
    setHasMoreContent(true)
    isPreloadingRef.current = false
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    isPreloading,
    preloadedCount,
    hasMoreContent,
    shouldPreload,
    triggerPreload,
    preloadContent,
    resetPreloader
  }
}









