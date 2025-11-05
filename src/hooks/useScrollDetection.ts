import { useState, useEffect, useRef, useCallback } from 'react'

interface ScrollIntent {
  isViewingMore: boolean
  isBackNavigation: boolean
  isNormalScroll: boolean
  scrollDirection: 'up' | 'down' | null
  isNearBottom: boolean
  isNearTop: boolean
}

interface UseScrollDetectionOptions {
  threshold?: number // Distance from bottom/top to trigger detection
  debounceMs?: number // Debounce time for scroll events
}

export const useScrollDetection = ({ 
  threshold = 100, 
  debounceMs = 100 
}: UseScrollDetectionOptions = {}) => {
  const [scrollIntent, setScrollIntent] = useState<ScrollIntent>({
    isViewingMore: false,
    isBackNavigation: false,
    isNormalScroll: false,
    scrollDirection: null,
    isNearBottom: false,
    isNearTop: false
  })
  
  const lastScrollY = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const detectScrollIntent = useCallback(() => {
    if (typeof window === 'undefined') return

    const currentScrollY = window.scrollY
    const scrollHeight = document.body.scrollHeight
    const windowHeight = window.innerHeight
    
    // Determine scroll direction
    const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up'
    lastScrollY.current = currentScrollY
    
    // Check if near bottom or top
    const isNearBottom = currentScrollY > (scrollHeight - windowHeight - threshold)
    const isNearTop = currentScrollY < threshold
    
    // Check if this is back navigation
    const isBackNavigation = !!sessionStorage.getItem('kobac_navigating_back')
    
    // Determine scroll intent
    const isViewingMore = scrollDirection === 'up' && !isBackNavigation && !isNearTop
    const isNormalScroll = !isBackNavigation && !isViewingMore
    
    const newScrollIntent: ScrollIntent = {
      isViewingMore,
      isBackNavigation,
      isNormalScroll,
      scrollDirection,
      isNearBottom,
      isNearTop
    }
    
    setScrollIntent(newScrollIntent)
    
    console.log('🔍 Scroll Detection:', {
      direction: scrollDirection,
      isViewingMore,
      isBackNavigation,
      isNormalScroll,
      scrollY: currentScrollY,
      isNearBottom,
      isNearTop
    })
    
    return newScrollIntent
  }, [threshold])

  const handleScroll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      detectScrollIntent()
    }, debounceMs)
  }, [detectScrollIntent, debounceMs])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial detection
    detectScrollIntent()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [handleScroll, detectScrollIntent])

  return {
    scrollIntent,
    detectScrollIntent,
    isViewingMore: scrollIntent.isViewingMore,
    isBackNavigation: scrollIntent.isBackNavigation,
    isNormalScroll: scrollIntent.isNormalScroll,
    scrollDirection: scrollIntent.scrollDirection,
    isNearBottom: scrollIntent.isNearBottom,
    isNearTop: scrollIntent.isNearTop
  }
}









