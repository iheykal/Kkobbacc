'use client'

import { useEffect } from 'react'
import Script from 'next/script'

// Extend Window interface to include Google Analytics properties
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

interface GoogleAnalyticsProps {
  gaId: string
}

export default function GoogleAnalyticsComponent({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Log for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Analytics initialized with ID:', gaId)
    }
  }, [gaId])

  if (!gaId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Google Analytics ID not provided')
    }
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize GA immediately when script loads
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(...args: any[]) {
            window.dataLayer.push(args);
          }
          window.gtag('js', new Date());
          window.gtag('config', gaId);
        }}
      />
    </>
  )
}