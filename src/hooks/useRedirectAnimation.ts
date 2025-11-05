import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseRedirectAnimationOptions {
  delay?: number
  destination: string
  message?: string
}

export const useRedirectAnimation = (options: UseRedirectAnimationOptions) => {
  const { delay = 2500, destination, message = "Redirecting..." } = options
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  const startRedirect = useCallback((path: string) => {
    setIsAnimating(true)
    
    const timer = setTimeout(() => {
      router.push(path)
      setIsAnimating(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [router, delay])

  return {
    isAnimating,
    startRedirect,
    animationProps: {
      isVisible: isAnimating,
      message,
      destination
    }
  }
}
