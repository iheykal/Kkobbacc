import { useEffect, useRef, useCallback } from 'react'

interface UseScrollRestorationOptions {
  key: string
  enabled?: boolean
  delay?: number
  maxAttempts?: number
  onSuccess?: () => void
  onError?: () => void
}

interface ScrollState {
  timestamp: number
  scrollPosition: number
  pathname: string
  search?: string
  hash?: string
  userAgent?: string
}

export const useScrollRestoration = ({ 
  key, 
  enabled = true, 
  delay = 100,
  maxAttempts = 4,
  onSuccess,
  onError,
}: UseScrollRestorationOptions) => {
  const hasRestored = useRef(false)
  const attempts = useRef(0)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const saveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined' || !enabled) return

    const currentState: ScrollState = {
      timestamp: Date.now(),
      scrollPosition: window.scrollY,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent
    }

    try {
      sessionStorage.setItem(`kobac_state_${key}`, JSON.stringify(currentState))
      console.log(`💾 useScrollRestoration: Saved scroll position ${window.scrollY} for key "${key}"`)
    } catch (error) {
      console.error('Error saving scroll position:', error)
    }
  }, [key, enabled])

  const restoreScrollPosition = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || hasRestored.current) return


    try {
      const savedState = sessionStorage.getItem(`kobac_state_${key}`)
      if (!savedState) {
        console.log(`⚠️ useScrollRestoration: No saved state found for key "${key}"`)
        // Clear the navigation flag if no state to restore
        sessionStorage.removeItem('kobac_navigating_back')
        return
      }

      const state: ScrollState = JSON.parse(savedState)
      
      // Verify the state is for the current path
      if (state.pathname !== window.location.pathname) {
        console.log(`⚠️ useScrollRestoration: Path mismatch. Saved: ${state.pathname}, Current: ${window.location.pathname}`)
        // Clear the navigation flag if path doesn't match
        sessionStorage.removeItem('kobac_navigating_back')
        return
      }

      if (state.scrollPosition && state.scrollPosition > 0) {
        attempts.current += 1
        console.log(`📍 useScrollRestoration: Attempt ${attempts.current}/${maxAttempts} - Restoring scroll to ${state.scrollPosition}`)
        
        window.scrollTo({
          top: state.scrollPosition,
          left: 0,
          behavior: 'instant'
        })

        // Check if restoration was successful
        setTimeout(() => {
          const currentScroll = window.scrollY
          const difference = Math.abs(currentScroll - state.scrollPosition)
          
          if (difference < 10) {
            console.log(`✅ useScrollRestoration: Successfully restored scroll position to ${state.scrollPosition}`)
            hasRestored.current = true
            // Clear the navigation flag after successful restoration
            sessionStorage.removeItem('kobac_navigating_back')
            onSuccess?.()
          } else if (attempts.current < maxAttempts) {
            console.log(`🔄 useScrollRestoration: Scroll restoration not accurate (diff: ${difference}), will retry`)
          } else {
            console.log(`❌ useScrollRestoration: Failed to restore scroll position after ${maxAttempts} attempts`)
            // Clear the navigation flag even on failure
            sessionStorage.removeItem('kobac_navigating_back')
            onError?.()
          }
        }, 50)
      }
    } catch (error) {
      console.error('Error parsing saved scroll state:', error)
    }
  }, [key, enabled, maxAttempts, onSuccess, onError])

  const clearSavedState = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.removeItem(`kobac_state_${key}`)
      console.log(`🗑️ useScrollRestoration: Cleared saved state for key "${key}"`)
    } catch (error) {
      console.error('Error clearing saved state:', error)
    }
  }, [key])


  // Auto-restore scroll position on mount ONLY if we're navigating back
  useEffect(() => {
    if (!enabled) return

    // Check if this is a back navigation, not normal page load
    const isNavigatingBack = sessionStorage.getItem('kobac_navigating_back')
    if (!isNavigatingBack) {
      console.log('🚫 useScrollRestoration: Normal page load detected, skipping auto-restoration')
      return
    }

    // Check if we've already attempted restoration
    if (hasRestored.current) {
      console.log('🚫 useScrollRestoration: Already restored, skipping')
      return
    }

    const restoreScroll = () => {
      if (hasRestored.current) return

      // Immediate attempt
      restoreScrollPosition()

      // Reduced scheduled attempts to prevent conflicts and blinks
      const delays = [delay] // Only 1 additional attempt to minimize blinks
      
      delays.forEach((delayMs, index) => {
        const timeout = setTimeout(() => {
          if (!hasRestored.current && attempts.current < maxAttempts) {
            restoreScrollPosition()
          }
        }, delayMs)
        
        timeoutRefs.current.push(timeout)
      })
    }

    // Start restoration process with a small delay
    const initialTimeout = setTimeout(restoreScroll, 50)
    timeoutRefs.current.push(initialTimeout)

    // Cleanup timeouts
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
      timeoutRefs.current = []
    }
  }, [enabled, delay, restoreScrollPosition, maxAttempts])

  // Reset restoration state when key changes
  useEffect(() => {
    hasRestored.current = false
    attempts.current = 0
  }, [key])

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearSavedState,
    hasRestored: hasRestored.current
  }
}