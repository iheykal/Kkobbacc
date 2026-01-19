'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LazyMotionDiv } from '@/components/lazy/LazyMotion'
import { useUser } from '@/contexts/UserContext'
import {
  Users,
  Home,
  Trash2,
  Settings,
  LogOut,
  User,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  PieChart,
  Search,
  Database,
  Building,
  MapPin,
  Award,
  Crown,
  Image
} from 'lucide-react'
import { LazyDistrictPieChart } from '@/components/lazy/LazyCharts'
import PropertySearch from '@/components/admin/PropertySearch'

export default function AdminDashboard() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading, logout } = useUser()
  const [pendingDeletionsCount, setPendingDeletionsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Admin useEffect - contextUser:', contextUser, 'isAuthenticated:', isAuthenticated, 'contextLoading:', contextLoading)
    console.log('🔍 Admin useEffect - user role:', contextUser?.role, 'user id:', contextUser?.id)

    // Wait for UserContext to finish loading
    if (contextLoading) {
      console.log('⏳ Admin - UserContext still loading, waiting...')
      return
    }

    // Only redirect if we're sure the user is not authenticated after loading is complete
    if (!isAuthenticated && !contextLoading) {
      console.log('❌ Admin - Not authenticated after loading, redirecting to home')
      console.log('❌ Admin - Redirect reason: !isAuthenticated && !contextLoading')
      router.push('/')
      return
    }

    if (contextUser && (contextUser.role === 'superadmin' || contextUser.role === 'super_admin')) {
      console.log('✅ Admin - Superadmin detected, fetching data')
      fetchPendingDeletionsCount()
    } else if (contextUser && !contextLoading) {
      console.log('❌ Admin - Access denied for role:', contextUser.role)
      console.log('❌ Admin - Redirect reason: Invalid role -', contextUser.role)
      setError('Access denied. Only superadmin can access this dashboard.')
      setLoading(false)
    } else if (!contextUser && !contextLoading && isAuthenticated) {
      // Handle case where contextUser is null but isAuthenticated is true (deployment issue)
      console.log('⚠️ Admin - User context is null but authenticated, attempting to validate session')
      setTimeout(() => {
        if (!contextUser) {
          console.log('❌ Admin - Still no user context after timeout, redirecting to home')
          console.log('❌ Admin - Redirect reason: No user context after timeout')
          router.push('/')
        }
      }, 3000) // Wait 3 seconds for context to load
    } else {
      console.log('🔍 Admin - No action taken, state:', { contextUser: !!contextUser, isAuthenticated, contextLoading })
    }
  }, [contextUser, isAuthenticated, contextLoading, router])

  const fetchPendingDeletionsCount = async () => {
    try {
      const response = await fetch('/api/properties/pending-deletion', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setPendingDeletionsCount(result.data?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching pending deletions count:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Use the UserContext logout function to ensure consistency
      logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: redirect anyway
      router.push('/')
    }
  }

  // Helper function to check if user is ultimate superadmin
  const isUltimateSuperadmin = (user: any) => {
    return user?.phone === '0610251014' ||
      user?.fullName === 'Kobac Property' ||
      user?.fullName?.toLowerCase().includes('kobac')
  }

  // Don't render anything until authentication check is complete
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  const adminModules = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'from-blue-600 to-indigo-700'
    },
    {
      title: 'Agent Management',
      description: 'Manage real estate agents and their profiles',
      icon: User,
      href: '/admin/agents',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'from-green-600 to-emerald-700'
    },
    {
      title: 'Pending Deletions',
      description: 'Review and confirm property deletion requests',
      icon: Trash2,
      href: '/admin/pending-deletions',
      color: 'from-red-500 to-pink-600',
      hoverColor: 'from-red-600 to-pink-700',
      badge: pendingDeletionsCount > 0 ? pendingDeletionsCount : null,
      badgeColor: 'bg-red-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-purple-500 to-violet-600',
      hoverColor: 'from-purple-600 to-violet-700'
    },
    {
      title: 'Analytics',
      description: 'View property statistics and district analytics',
      icon: PieChart,
      href: '/admin/analytics',
      color: 'from-orange-500 to-red-600',
      hoverColor: 'from-orange-600 to-red-700'
    },
    {
      title: 'Property Search',
      description: 'Search and view detailed property information',
      icon: Search,
      href: '/admin/property-search',
      color: 'from-indigo-500 to-purple-600',
      hoverColor: 'from-indigo-600 to-purple-700'
    },
    {
      title: 'Property Expiration',
      description: 'Manage property expiration dates and cleanup expired listings',
      icon: Clock,
      href: '/admin/property-expiration',
      color: 'from-amber-500 to-orange-600',
      hoverColor: 'from-amber-600 to-orange-700'
    },
    {
      title: 'Fix Properties',
      description: 'Fix property status to make them visible on main page',
      icon: Database,
      href: '/admin/fix-properties',
      color: 'from-emerald-500 to-teal-600',
      hoverColor: 'from-emerald-600 to-teal-700'
    },
    {
      title: 'Fix Agent Data',
      description: 'Fix agent data for properties',
      icon: User,
      href: '/admin/fix-agent-data',
      color: 'from-blue-500 to-cyan-600',
      hoverColor: 'from-blue-600 to-cyan-700'
    },
    {
      title: 'Test Dhammaan Degmooyin-ka',
      description: 'Check district data in database',
      icon: MapPin,
      href: '/admin/test-districts',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'from-green-600 to-emerald-700'
    },
    {
      title: 'Fix Property Types',
      description: 'Fix invalid property types like single-family',
      icon: Building,
      href: '/admin/fix-property-types',
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'from-purple-600 to-pink-700'
    },
    {
      title: 'Check Property Types',
      description: 'Check current property types in database',
      icon: Building,
      href: '/admin/check-property-types',
      color: 'from-indigo-500 to-purple-600',
      hoverColor: 'from-indigo-600 to-purple-700'
    },
    // Only show Blue Tick Management to ultimate superadmin
    ...(isUltimateSuperadmin(contextUser) ? [{
      title: 'Blue Tick Management',
      description: 'Manage agent verification badges (Ultimate Superadmin Only)',
      icon: Award,
      href: '/admin/blue-tick-management',
      color: 'from-yellow-500 to-orange-600',
      hoverColor: 'from-yellow-600 to-orange-700'
    }] : []),
    // Only show Test Blue Tick System to ultimate superadmin
    ...(isUltimateSuperadmin(contextUser) ? [{
      title: 'Test Blue Tick System',
      description: 'Test the blue tick verification system functionality',
      icon: Award,
      href: '/admin/test-blue-tick',
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'from-purple-600 to-pink-700'
    }] : []),
    {
      title: 'Fix Properties Status',
      description: 'Fix uploaded properties that are not appearing',
      icon: Database,
      href: '/admin/fix-properties-status',
      color: 'from-emerald-500 to-teal-600',
      hoverColor: 'from-emerald-600 to-teal-700'
    },
    {
      title: 'Fix Thumbnail Duplication',
      description: 'Fix properties where thumbnail appears multiple times in gallery',
      icon: Image,
      href: '/admin/fix-thumbnail-duplication',
      color: 'from-orange-500 to-red-600',
      hoverColor: 'from-orange-600 to-red-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Kobac Property</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {contextUser?.firstName || 'Admin'}
                {isUltimateSuperadmin(contextUser) && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-lg border border-blue-500">
                    <Crown className="w-3 h-3 mr-1" />
                    ULTIMATE SUPERADMIN
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Admin Dashboard
          </h2>
          <p className="text-gray-600">
            Manage your real estate platform, users, and system settings
          </p>

          {!isUltimateSuperadmin(contextUser) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Crown className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Blue tick management features are only available to the ultimate superadmin.
                  Contact the system administrator for blue tick verification requests.
                </p>
              </div>
            </div>
          )}
        </LazyMotionDiv>

        {/* Quick Stats */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Deletions</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{pendingDeletionsCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Agents</p>
                <p className="text-3xl font-bold text-green-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-3xl font-bold text-green-600 mt-2">Online</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </LazyMotionDiv>

        {/* Admin Modules */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Administrative Functions</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {adminModules.map((module, index) => (
              <LazyMotionDiv
                key={module.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group cursor-pointer"
                onClick={() => router.push(module.href)}
              >
                <div className={`bg-gradient-to-r ${module.color} hover:${module.hoverColor} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden`}>
                  {/* Badge for pending deletions */}
                  {module.badge && (
                    <div className={`absolute top-4 right-4 ${module.badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                      {module.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <module.icon className="w-8 h-8" />
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <h4 className="text-lg font-semibold mb-2">{module.title}</h4>
                  <p className="text-sm opacity-90">{module.description}</p>
                </div>
              </LazyMotionDiv>
            ))}
          </div>
        </LazyMotionDiv>

        {/* Property Search */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Property Search</h3>
          <PropertySearch />
        </LazyMotionDiv>

        {/* District Analytics Chart */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Property Analytics</h3>
          <LazyDistrictPieChart />
        </LazyMotionDiv>

        {/* Quick Actions */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin/pending-deletions')}
                disabled={pendingDeletionsCount === 0}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                <span>Review Deletions ({pendingDeletionsCount})</span>
              </button>

              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </button>

              <button
                onClick={() => router.push('/admin/agents')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Manage Agents</span>
              </button>
            </div>
          </div>
        </LazyMotionDiv>
      </div>
    </div>
  )
}
