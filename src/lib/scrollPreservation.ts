/**
 * Global Scroll Preservation System
 * Preserves scroll position for all pages across navigation
 */

const SCROLL_PRESERVATION_KEY = 'kobac_scroll_positions'
const SCROLL_DEBOUNCE_MS = 150

interface ScrollPositions {
  [pathname: string]: {
    scrollY: number
    timestamp: number
  }
}

/**
 * Save scroll position for current page
 */
export function saveScrollPosition(pathname: string, scrollY: number): void {
  if (typeof window === 'undefined') return

  try {
    const saved = sessionStorage.getItem(SCROLL_PRESERVATION_KEY)
    const positions: ScrollPositions = saved ? JSON.parse(saved) : {}
    
    positions[pathname] = {
      scrollY,
      timestamp: Date.now()
    }
    
    sessionStorage.setItem(SCROLL_PRESERVATION_KEY, JSON.stringify(positions))
  } catch (error) {
    console.error('Error saving scroll position:', error)
  }
}

/**
 * Get saved scroll position for a page
 */
export function getScrollPosition(pathname: string): number | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = sessionStorage.getItem(SCROLL_PRESERVATION_KEY)
    if (!saved) return null
    
    const positions: ScrollPositions = JSON.parse(saved)
    const position = positions[pathname]
    
    // Only use position if it's less than 5 minutes old
    if (position && Date.now() - position.timestamp < 5 * 60 * 1000) {
      return position.scrollY
    }
    
    return null
  } catch (error) {
    console.error('Error getting scroll position:', error)
    return null
  }
}

/**
 * Clear scroll position for a page
 */
export function clearScrollPosition(pathname: string): void {
  if (typeof window === 'undefined') return

  try {
    const saved = sessionStorage.getItem(SCROLL_PRESERVATION_KEY)
    if (!saved) return
    
    const positions: ScrollPositions = JSON.parse(saved)
    delete positions[pathname]
    
    sessionStorage.setItem(SCROLL_PRESERVATION_KEY, JSON.stringify(positions))
  } catch (error) {
    console.error('Error clearing scroll position:', error)
  }
}

/**
 * Clear all scroll positions
 */
export function clearAllScrollPositions(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(SCROLL_PRESERVATION_KEY)
  } catch (error) {
    console.error('Error clearing all scroll positions:', error)
  }
}

/**
 * Restore scroll position for a page
 */
export function restoreScrollPosition(pathname: string, behavior: ScrollBehavior = 'instant'): boolean {
  if (typeof window === 'undefined') return false

  const scrollY = getScrollPosition(pathname)
  if (scrollY !== null && scrollY > 0) {
    window.scrollTo({
      top: scrollY,
      left: 0,
      behavior
    })
    return true
  }
  
  return false
}

/**
 * Setup scroll tracking for current page
 */
export function setupScrollTracking(pathname: string): () => void {
  if (typeof window === 'undefined') return () => {}

  let timeoutId: NodeJS.Timeout | null = null

  const handleScroll = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      const scrollY = window.scrollY
      saveScrollPosition(pathname, scrollY)
    }, SCROLL_DEBOUNCE_MS)
  }

  window.addEventListener('scroll', handleScroll, { passive: true })

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    window.removeEventListener('scroll', handleScroll)
  }
}

