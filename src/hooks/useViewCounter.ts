'use client'

import { useState, useEffect } from 'react'

interface ViewCounterOptions {
  propertyId: string
  persistAcrossSessions?: boolean
}

export const useViewCounter = ({ propertyId, persistAcrossSessions = true }: ViewCounterOptions) => {
  const [viewCount, setViewCount] = useState(0)
  const [isReturningFromBack, setIsReturningFromBack] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storageKey = `kobac_view_count_${propertyId}`
    const sessionKey = `kobac_session_view_${propertyId}`
    
    // Check if we're returning from back navigation
    const returningFromBack = sessionStorage.getItem('kobac_navigating_back')
    if (returningFromBack) {
      setIsReturningFromBack(true)
      // Restore view count from session storage
      const sessionCount = sessionStorage.getItem(sessionKey)
      if (sessionCount) {
        setViewCount(parseInt(sessionCount))
      }
    } else {
      // New visit - increment counter
      const currentCount = persistAcrossSessions 
        ? parseInt(localStorage.getItem(storageKey) || '0')
        : parseInt(sessionStorage.getItem(sessionKey) || '0')
      
      const newCount = currentCount + 1
      setViewCount(newCount)
      
      // Save to appropriate storage
      if (persistAcrossSessions) {
        localStorage.setItem(storageKey, newCount.toString())
      }
      sessionStorage.setItem(sessionKey, newCount.toString())
    }
  }, [propertyId, persistAcrossSessions])

  const incrementViewCount = () => {
    const newCount = viewCount + 1
    setViewCount(newCount)
    
    const storageKey = `kobac_view_count_${propertyId}`
    const sessionKey = `kobac_session_view_${propertyId}`
    
    if (persistAcrossSessions) {
      localStorage.setItem(storageKey, newCount.toString())
    }
    sessionStorage.setItem(sessionKey, newCount.toString())
  }

  return {
    viewCount,
    isReturningFromBack,
    incrementViewCount
  }
}
