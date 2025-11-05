'use client'

import Hero from '@/components/sections/Hero'
import { Button } from '@/components/ui/Button'
import { User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useRedirectAnimation } from '@/hooks/useRedirectAnimation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'
import { useNavigation } from '@/contexts/NavigationContext'
import { useEffect, useState, Suspense } from 'react'
import { SampleHomesSimplified } from '@/components/sections/SampleHomesSimplified'
import { preventPageRefresh, isBackNavigation } from '@/lib/navigationPrevention'
import { useSearchParams, useRouter } from 'next/navigation'
import Head from 'next/head'

// Component that uses useSearchParams - needs to be wrapped in Suspense
function HomePageContent() {
  const { user, isAuthenticated, isLoading } = useUser()
  const { preserveState, getPreservedState } = useNavigation()
  const { isAnimating, startRedirect, animationProps } = useRedirectAnimation({
    destination: "Agent Dashboard",
    message: "Taking you to your dashboard..."
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  

  // Initialize navigation prevention - temporarily disabled
  // useEffect(() => {
  //   const cleanup = preventPageRefresh()
  //   return cleanup
  // }, [])

  // Scroll preservation is now handled globally by ScrollPreservationProvider
  // No page-specific scroll handling needed

  const handleAgentDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    startRedirect('/agent')
  }


  return (
    <>
      <Head>
        <title>Kobac Real Estate - Premium Properties in Mogadishu</title>
        <meta name="description" content="Discover luxury villas, modern apartments, and premium properties in Mogadishu. Kobac Real Estate offers the finest selection of homes for sale and rent. Find your dream property today." />
        <meta name="keywords" content="real estate, mogadishu, properties, villas, apartments, houses, luxury homes, for sale, for rent, somalia property" />
        <meta property="og:title" content="Kobac Real Estate - Premium Properties in Mogadishu" />
        <meta property="og:description" content="Discover luxury villas, modern apartments, and premium properties in Mogadishu." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${typeof window !== 'undefined' ? window.location.origin : ''}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kobac Real Estate - Premium Properties" />
        <meta name="twitter:description" content="Discover luxury villas and modern apartments in Mogadishu." />
      </Head>
      <div className="min-h-screen">
        {/* Redirect Animation */}
        <RedirectAnimation {...animationProps} />
      
      
      
      {/* Background Auth Loader - Hidden */}
      {/* {isLoading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Agent Dashboard Access Button - Only show when auth is loaded and user is agent */}
      {!isLoading && isAuthenticated && user?.role === 'agent' && (
        <>
          {/* Desktop/Tablet Button - Positioned below header */}
          <div className="hidden sm:block fixed top-20 right-4 z-40">
            <Button 
              onClick={handleAgentDashboardClick}
              variant="secondary" 
              size="sm"
              className="bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white shadow-lg border border-blue-200 font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <User className="w-4 h-4 mr-2" />
              Agent Dashboard
            </Button>
          </div>
          
          {/* Mobile Floating Action Button */}
          <div className="sm:hidden fixed bottom-6 right-6 z-50 relative">
            <Button 
              onClick={handleAgentDashboardClick}
              variant="secondary" 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl border-0 font-semibold w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <User className="w-6 h-6" />
            </Button>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
              Agent
            </div>
          </div>
        </>
      )}


        <Hero />
        <SampleHomesSimplified />
        

      </div>
    </>
  )
}

// Main export with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
