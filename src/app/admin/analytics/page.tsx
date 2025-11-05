'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LazyMotionDiv } from '@/components/lazy/LazyMotion'
import { useUser } from '@/contexts/UserContext'
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  MapPin,
  DollarSign,
  Home,
  Users,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { 
  LazyDistrictPieChart, 
  LazyPropertyTypePieChart, 
  LazyListingTypePieChart,
  LazyPropertyViewStats 
} from '@/components/lazy/LazyCharts'
import PropertySearch from '@/components/admin/PropertySearch'

export default function AnalyticsPage() {
  const router = useRouter()
  const { user: contextUser, isAuthenticated, isLoading: contextLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (contextUser && (contextUser.role === 'superadmin' || contextUser.role === 'super_admin')) {
      setLoading(false)
    } else if (contextUser) {
      setError('Access denied. Only superadmin can access analytics.')
      setLoading(false)
    }
  }, [contextUser, isAuthenticated, contextLoading, router])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <LazyMotionDiv 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          transition: { duration: 0.3 }
        }}
        className="bg-white/80 backdrop-blur-sm border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <LazyMotionDiv 
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
                className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center"
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </LazyMotionDiv>
              <h1 
                className="text-xl font-bold text-gray-900"
              >
                Analytics Dashboard
              </h1>
            </div>
            
            <div 
              className="text-sm text-gray-600"
            >
              Welcome, {contextUser?.firstName || 'Admin'}
            </div>
          </div>
        </div>
      </LazyMotionDiv>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Property Analytics
          </h2>
          <p className="text-gray-600">
            Comprehensive insights into property distribution and market trends
          </p>
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
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Home className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-green-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Views</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Dhammaan Degmooyin-ka</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">-</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </LazyMotionDiv>

        {/* Property Search */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ 
            scale: 1.01,
            y: -2,
            transition: { duration: 0.3 }
          }}
          className="mb-8 cursor-pointer"
        >
          <PropertySearch />
        </LazyMotionDiv>

                 {/* Charts Section */}
         <LazyMotionDiv
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
         >
           {/* District Analytics Chart */}
           <LazyMotionDiv
             whileHover={{ 
               scale: 1.02,
               y: -5,
               transition: { duration: 0.3 }
             }}
             className="cursor-pointer"
           >
             <LazyDistrictPieChart />
           </LazyMotionDiv>

           {/* Property Type Analytics Chart */}
           <LazyMotionDiv
             whileHover={{ 
               scale: 1.02,
               y: -5,
               transition: { duration: 0.3 }
             }}
             className="cursor-pointer"
           >
             <LazyPropertyTypePieChart />
           </LazyMotionDiv>

           {/* Listing Type Analytics Chart */}
           <LazyMotionDiv
             whileHover={{ 
               scale: 1.02,
               y: -5,
               transition: { duration: 0.3 }
             }}
             className="cursor-pointer"
           >
             <LazyListingTypePieChart />
           </LazyMotionDiv>
         </LazyMotionDiv>

        {/* Property View Analytics */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ 
            scale: 1.01,
            y: -3,
            transition: { duration: 0.3 }
          }}
          className="mb-8 cursor-pointer"
        >
          <LazyPropertyViewStats />
        </LazyMotionDiv>

        {/* Additional Analytics Sections */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Price Range Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Price Range Analysis</h3>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Price range analytics coming soon...</p>
            </div>
          </div>

          {/* Market Trends */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Trends</h3>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Market trend analytics coming soon...</p>
            </div>
          </div>
        </LazyMotionDiv>

        {/* Quick Actions */}
        <LazyMotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </button>
              
              <button
                onClick={() => router.push('/admin/agents')}
                className="flex items-center justify-center space-x-3 px-6 py-4 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Agent Management</span>
              </button>
            </div>
          </div>
        </LazyMotionDiv>
      </div>
    </div>
  )
}
