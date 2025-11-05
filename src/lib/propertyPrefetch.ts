/**
 * Property Prefetching Utilities
 * Prefetches property data on hover for instant loading
 */

/**
 * Prefetch property data on hover
 */
export function prefetchProperty(propertyId: string | number): void {
  if (typeof window === 'undefined') return

  const id = String(propertyId)
  const cacheKey = `property_${id}`
  
  // Check if already cached
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      const cacheAge = Date.now() - (parsed.timestamp || 0)
      // If cache is fresh (< 2 minutes), skip prefetch
      if (cacheAge < 2 * 60 * 1000) {
        return
      }
    } catch {
      // Continue to prefetch if cache is invalid
    }
  }

  // Prefetch property data in background
  fetch(`/api/properties/${id}`, {
    cache: 'force-cache',
    priority: 'low'
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data) {
        // Cache the prefetched data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data.data,
          timestamp: Date.now()
        }))
      }
    })
    .catch(() => {
      // Silent error - prefetch failures shouldn't affect UX
    })
}

/**
 * Prefetch property URL (Next.js route prefetch)
 */
export function prefetchPropertyUrl(url: string): void {
  if (typeof window === 'undefined') return

  // Use Next.js router prefetch if available
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Prefetch the route
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

/**
 * Prefetch property data and URL on hover
 */
export function setupPropertyPrefetch(
  propertyId: string | number,
  url: string,
  element: HTMLElement
): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  const handleMouseEnter = () => {
    // Delay prefetch slightly to avoid unnecessary requests
    timeoutId = setTimeout(() => {
      prefetchProperty(propertyId)
      prefetchPropertyUrl(url)
    }, 200) // 200ms delay
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  element.addEventListener('mouseenter', handleMouseEnter)
  element.addEventListener('touchstart', handleMouseEnter, { passive: true })

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter)
    element.removeEventListener('touchstart', handleMouseEnter)
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

