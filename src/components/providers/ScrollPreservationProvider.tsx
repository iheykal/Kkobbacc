'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  saveScrollPosition, 
  restoreScrollPosition, 
  setupScrollTracking 
} from '@/lib/scrollPreservation'

interface ScrollPreservationProviderProps {
  children: React.ReactNode
}

export const ScrollPreservationProvider = ({ children }: ScrollPreservationProviderProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasRestoredRef = useRef(false)
  const isNavigatingBackRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Create unique page key with pathname and search params
  const getPageKey = () => {
    const search = searchParams.toString()
    return search ? `${pathname}?${search}` : pathname
  }

  // Listen for browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      // Browser back/forward button pressed - mark as back navigation
      sessionStorage.setItem('kobac_navigating_back', 'true')
      isNavigatingBackRef.current = true
      hasRestoredRef.current = false
    }

    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Check if this is a back navigation (check on mount and pathname change)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for back navigation flag
    const isBackNav = sessionStorage.getItem('kobac_navigating_back') === 'true'
    isNavigatingBackRef.current = isBackNav
    
    // Reset restoration flag when pathname changes
    if (!isBackNav) {
      hasRestoredRef.current = false
    }
  }, [pathname])

  // Setup scroll tracking for current page
  useEffect(() => {
    const pageKey = getPageKey()
    
    // Cleanup previous scroll tracking
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    
    // Setup new scroll tracking
    cleanupRef.current = setupScrollTracking(pageKey)
    
    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [pathname, searchParams])

  // Restore scroll position on page load (only if navigating back)
  useEffect(() => {
    if (typeof window === 'undefined' || hasRestoredRef.current) return

    const pageKey = getPageKey()
    
    // Check again for back navigation (might have been set after mount)
    const isBackNav = sessionStorage.getItem('kobac_navigating_back') === 'true'
    isNavigatingBackRef.current = isBackNav
    
    // Only restore if navigating back
    if (isBackNav) {
      // Try restoring immediately
      let restored = restoreScrollPosition(pageKey, 'instant')
      
      if (restored) {
        hasRestoredRef.current = true
        // Clear the flag after successful restoration
        sessionStorage.removeItem('kobac_navigating_back')
      } else {
        // If immediate restore didn't work, try after delays (for pages that load content)
        const timeout1 = setTimeout(() => {
          if (!hasRestoredRef.current) {
            restored = restoreScrollPosition(pageKey, 'instant')
            if (restored) {
              hasRestoredRef.current = true
              sessionStorage.removeItem('kobac_navigating_back')
            }
          }
        }, 100)

        const timeout2 = setTimeout(() => {
          if (!hasRestoredRef.current) {
            restored = restoreScrollPosition(pageKey, 'instant')
            if (restored) {
              hasRestoredRef.current = true
              sessionStorage.removeItem('kobac_navigating_back')
            }
          }
        }, 300)

        const timeout3 = setTimeout(() => {
          if (!hasRestoredRef.current) {
            restored = restoreScrollPosition(pageKey, 'instant')
            if (restored) {
              hasRestoredRef.current = true
            }
            // Always clear flag after last attempt
            sessionStorage.removeItem('kobac_navigating_back')
          }
        }, 600)

        return () => {
          clearTimeout(timeout1)
          clearTimeout(timeout2)
          clearTimeout(timeout3)
        }
      }
    }
    // Forward navigation is handled by ScrollToTopProvider
  }, [pathname, searchParams])

  // Save scroll position before navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const pageKey = getPageKey()

    const handleBeforeUnload = () => {
      saveScrollPosition(pageKey, window.scrollY)
    }

    // Save on before unload
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Also save on visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition(pageKey, window.scrollY)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Save final scroll position
      saveScrollPosition(pageKey, window.scrollY)
    }
  }, [pathname, searchParams])

  // Reset restore flag when pathname changes
  useEffect(() => {
    hasRestoredRef.current = false
    isNavigatingBackRef.current = false
  }, [pathname])

  return <>{children}</>
}

