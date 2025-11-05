'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { formatPrice as formatPriceUtil } from '@/lib/utils'
import { 
  Home, Search, Heart, User, Settings, LogOut, MapPin, Bed, Bath, Ruler, Eye, Users, Building2
} from 'lucide-react'
import NextImage from 'next/image'

interface Property {
  _id: string
  title: string
  price: number
  location: string
  bedrooms: number
  bathrooms: number
  area: number
  thumbnailImage?: string
  images: string[]
  status: string
  views: number
  createdAt: string
}

export default function DashboardPage() {
  // ✅ use the context's auth state; DO NOT redirect while auth is loading
  const { user, isLoading: authLoading, logout } = useUser()
  const router = useRouter()

  // page-data loading (separate from auth)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalProperties: 0, savedProperties: 0, recentViews: 0, favoriteAgents: 0 })

  useEffect(() => {
    console.log('🔍 Dashboard useEffect - authLoading:', authLoading, 'user:', user)
    // 🚫 Do nothing until auth is resolved
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }

    // ❌ Not authenticated → go home (once)
    if (!user) {
      console.log('❌ No user found, redirecting to home')
      router.replace('/')
      return
    }

    // 🔐 Role routing (once)
    if (user.role === 'superadmin' || user.role === 'super_admin') {
      console.log('✅ Superadmin detected, redirecting to /admin')
      router.replace('/admin')
      return
    }
    if (user.role === 'agent' || user.role === 'agency') {
      console.log('✅ Agent detected, redirecting to /agent')
      router.replace('/agent')
      return
    }

    // ✅ Regular user path → fetch dashboard data once
    console.log('✅ Regular user detected, fetching dashboard data')
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]) // ← no local page isLoading in deps

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔍 Dashboard: Starting to fetch properties data...')
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const res = await fetch('/api/properties?limit=20', {
        cache: 'force-cache',
        next: { revalidate: 300 },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('🔍 Dashboard: API response received:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('🔍 Dashboard: Properties data:', data)
        const recent = data.data?.slice(0, 6) || []
        setProperties(recent)
        setStats(s => ({ ...s, totalProperties: recent.length, savedProperties: 0 }))
        console.log('✅ Dashboard: Data loaded successfully')
      } else {
        console.error('❌ Dashboard: API error:', res.status, res.statusText)
        setError(`Failed to load properties: ${res.status} ${res.statusText}`)
        setProperties([])
        setStats(s => ({ ...s, totalProperties: 0, savedProperties: 0 }))
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.error('❌ Dashboard: Request timeout - API took too long to respond')
        setError('Request timeout - the server took too long to respond. Please try again.')
      } else {
        console.error('❌ Dashboard: Error fetching dashboard data:', e)
        setError('Failed to load dashboard data. Please check your connection and try again.')
      }
      setProperties([])
      setStats(s => ({ ...s, totalProperties: 0, savedProperties: 0 }))
    } finally {
      setIsLoading(false)
      console.log('🔍 Dashboard: Loading state set to false')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  // ⏳ Show your existing skeleton while either auth is loading, unauthenticated, or page data loading
  if (authLoading || !user || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* --- keep your skeleton content unchanged --- */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg mb-8">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="p-4 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => router.push('/properties')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Search className="w-4 h-4" /><span>Browse Properties</span>
                </button>
                <button onClick={async () => { await handleLogout() }} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- RENDER (authenticated regular user) ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/properties')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Search className="w-4 h-4" /><span>Browse Properties</span>
              </button>
              <button onClick={async () => { await handleLogout() }} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content (unchanged except it uses state above) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Properties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.savedProperties}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentViews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorite Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.favoriteAgents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => router.push('/properties')} className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <Search className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Browse Properties</h3>
              <p className="text-sm text-gray-600">Find your dream home</p>
            </button>
            <button onClick={() => router.push('/agents')} className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Find Agents</h3>
              <p className="text-sm text-gray-600">Connect with real estate experts</p>
            </button>
            <button onClick={() => router.push('/profile')} className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left">
              <User className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-600">Manage your account</p>
            </button>
          </div>
        </motion.div>

        {/* Recent Properties */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Properties</h2>
            <button onClick={() => router.push('/properties')} className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 6).map(property => (
                <div key={property._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {!!(property.thumbnailImage || property.images?.length) && (
                    <div className="relative h-48">
                      <NextImage src={property.thumbnailImage || property.images[0]} alt={property.title} fill className="object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                        {property.status}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center"><Bed className="w-4 h-4 mr-1" />{property.bedrooms}</span>
                        <span className="flex items-center"><Bath className="w-4 h-4 mr-1" />{property.bathrooms}</span>
                        <span className="flex items-center"><Ruler className="w-4 h-4 mr-1" />{property.area} sqft</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{formatPriceUtil(property.price)}</span>
                      <span className="text-xs text-gray-500">{formatDate(property.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-600 mb-4">Start exploring available properties</p>
              <button onClick={() => router.push('/properties')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Properties
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}