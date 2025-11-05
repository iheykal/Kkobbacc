'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface NavigationContextType {
  previousPage: string | null
  setPreviousPage: (page: string) => void
  goBack: () => void
  isNavigating: boolean
  preserveState: (key: string, data: any) => void
  getPreservedState: (key: string) => any
  isReturningFromBack: boolean
  showStateRestored: boolean
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const router = useRouter()
  const [previousPage, setPreviousPageState] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isReturningFromBack, setIsReturningFromBack] = useState(false)
  const [showStateRestored, setShowStateRestored] = useState(false)

  // Initialize previous page from sessionStorage and cleanup old data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('kobac_previous_page')
      if (stored) {
        setPreviousPageState(stored)
      }

      // Check if we're returning from a back navigation
      const returningFromBack = sessionStorage.getItem('kobac_navigating_back')
      if (returningFromBack) {
        setIsReturningFromBack(true)
        sessionStorage.removeItem('kobac_navigating_back')
        
        // Show state restored indicator
        setShowStateRestored(true)
        setTimeout(() => setShowStateRestored(false), 3000)
      }

      // Cleanup old session storage data to prevent corruption
      const cleanupOldData = () => {
        try {
          // Remove old navigation flags that might be stuck
          const oldFlags = ['kobac_navigating_back']
          oldFlags.forEach(flag => {
            const value = sessionStorage.getItem(flag)
            if (value) {
              // Check if the flag is older than 5 minutes
              const timestamp = parseInt(value.split('_')[1] || '0', 10)
              if (Date.now() - timestamp > 5 * 60 * 1000) {
                sessionStorage.removeItem(flag)
                console.log('🧹 NavigationContext: Cleaned up old flag:', flag)
              }
            }
          })
        } catch (error) {
          console.error('Error cleaning up session storage:', error)
        }
      }

      // Cleanup immediately and then every 2 minutes
      cleanupOldData()
      const cleanupInterval = setInterval(cleanupOldData, 2 * 60 * 1000)

      // Handle browser back/forward buttons with History API
      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.kobacState) {
          setIsReturningFromBack(true)
          setShowStateRestored(true)
          setTimeout(() => setShowStateRestored(false), 3000)
        }
      }

      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
        clearInterval(cleanupInterval)
      }
    }
  }, [])

  const setPreviousPage = (page: string) => {
    setPreviousPageState(page)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('kobac_previous_page', page)
    }
  }

  const preserveState = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`kobac_state_${key}`, JSON.stringify(data))
      
      // Also add to history state for better navigation handling
      const currentState = history.state || {}
      history.replaceState({
        ...currentState,
        kobacState: true,
        [`kobac_${key}`]: data
      }, '')
    }
  }

  const getPreservedState = (key: string) => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`kobac_state_${key}`)
      return stored ? JSON.parse(stored) : null
    }
    return null
  }

  const goBack = () => {
    setIsNavigating(true)
    
    if (typeof window !== 'undefined') {
      try {
        // Mark that we're navigating back for scroll restoration
        sessionStorage.setItem('kobac_navigating_back', 'true')
        setIsReturningFromBack(true)
        
        // Always try browser back navigation first - it's the most reliable
        router.back()
        
        // Clear the flag after a delay (scroll preservation will handle restoration)
        setTimeout(() => {
          sessionStorage.removeItem('kobac_navigating_back')
        }, 1000)
      } catch (error) {
        console.error('❌ NavigationContext: Error with back navigation:', error)
        sessionStorage.removeItem('kobac_navigating_back')
        
        // Only use fallback in case of actual error
        const previousPage = sessionStorage.getItem('kobac_previous_page')
        if (previousPage) {
          router.push(previousPage)
        } else {
          router.push('/')
        }
      }
    } else {
      router.push('/')
    }
    
    // Reset navigating state after a short delay
    setTimeout(() => setIsNavigating(false), 100)
  }

  return (
    <NavigationContext.Provider value={{
      previousPage,
      setPreviousPage,
      goBack,
      isNavigating,
      preserveState,
      getPreservedState,
      isReturningFromBack,
      showStateRestored
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
