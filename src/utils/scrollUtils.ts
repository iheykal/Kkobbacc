/**
 * Scroll to top of the page with smooth animation
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior
    })
  }
}

/**
 * Scroll to top instantly (for page refresh)
 */
export const scrollToTopInstant = () => {
  scrollToTop('instant')
}

/**
 * Scroll to a specific element
 */
export const scrollToElement = (elementId: string, offset: number = 0) => {
  if (typeof window !== 'undefined') {
    const element = document.getElementById(elementId)
    if (element) {
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        left: 0,
        behavior: 'smooth'
      })
    }
  }
}

/**
 * Get current scroll position
 */
export const getScrollPosition = (): number => {
  if (typeof window !== 'undefined') {
    return window.scrollY
  }
  return 0
}

/**
 * Check if user is at the top of the page
 */
export const isAtTop = (): boolean => {
  return getScrollPosition() === 0
}

/**
 * Handle page refresh scroll behavior
 */
export const handlePageRefresh = () => {
  if (typeof window !== 'undefined') {
    // Clear any stored scroll position
    sessionStorage.removeItem('scrollPosition')
    
    // Scroll to top immediately
    scrollToTopInstant()
  }
}
