'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface ScrollToTopProviderProps {
  children: React.ReactNode
}

export const ScrollToTopProvider = ({ children }: ScrollToTopProviderProps) => {
  const pathname = usePathname()

  useEffect(() => {
    // Only scroll to top on forward navigation, not back navigation
    if (typeof window !== 'undefined') {
      const isNavigatingBack = sessionStorage.getItem('kobac_navigating_back') === 'true'
      
      if (!isNavigatingBack) {
        // Forward navigation - scroll to top
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }
    }
  }, [pathname])

  return <>{children}</>
}
