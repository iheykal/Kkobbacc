'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import PropertyExpirationModal from '@/components/admin/PropertyExpirationModal'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Search
} from 'lucide-react'

interface ExpirationStats {
  totalProperties: number
  activeProperties: number
  expiredProperties: number
  expiringSoonCount: number
  needsExpirationUpdate: number
  cleanupNeeded: boolean
}

interface ExpiredProperty {
  _id: string
  propertyId: number
  title: string
  location: string
  district: string
  listingType: string
  expiresAt: string
  createdAt: string
  agentName: string
  daysExpired?: number
  isExpired?: boolean
}

interface ExpiringSoonProperty {
  _id: string
  propertyId: number
  title: string
  location: string
  district: string
  listingType: string
  expiresAt: string
  agentName: string
  daysUntilExpiry: number
}

export default function PropertyExpirationPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useUser()
  const [stats, setStats] = useState<ExpirationStats | null>(null)
  const [expiredProperties, setExpiredProperties] = useState<ExpiredProperty[]>([])
  const [expiringSoonProperties, setExpiringSoonProperties] = useState<ExpiringSoonProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'expired' | 'expiring'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'rent'>('all')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProperty, setSelectedProperty] = useState<any>(null)
  const [showExpirationModal, setShowExpirationModal] = useState(false)

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Function to calculate countdown time
  const getCountdownTime = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt)
    const now = currentTime
    const diff = expirationDate.getTime() - now.getTime()

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { expired: false, days, hours, minutes, seconds }
  }

  // Function to format countdown display
  const formatCountdown = (expiresAt: string) => {
    const countdown = getCountdownTime(expiresAt)
    
    if (countdown.expired) {
      return 'Expired'
    }

    const parts = []
    if (countdown.days > 0) parts.push(`${countdown.days}d`)
    if (countdown.hours > 0) parts.push(`${countdown.hours}h`)
    if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`)
    if (countdown.seconds > 0) parts.push(`${countdown.seconds}s`)

    return parts.length > 0 ? parts.join(' ') : 'Expiring now'
  }

  // Function to get countdown color based on time remaining
  const getCountdownColor = (expiresAt: string) => {
    const countdown = getCountdownTime(expiresAt)
    
    if (countdown.expired) return 'text-red-600 bg-red-100'
    if (countdown.days <= 1) return 'text-red-500 bg-red-50'
    if (countdown.days <= 3) return 'text-orange-600 bg-orange-100'
    if (countdown.days <= 7) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property)
    setShowExpirationModal(true)
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/scheduled-cleanup', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchExpiredProperties = async () => {
    try {
      const response = await fetch('/api/admin/cleanup-expired-properties', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setExpiredProperties(data.data.expiredProperties || [])
      }
    } catch (error) {
      console.error('Failed to fetch expired properties:', error)
    }
  }

  const fetchExpiringSoonProperties = async () => {
    try {
      const response = await fetch('/api/admin/scheduled-cleanup', {
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        setExpiringSoonProperties(data.data.expiringSoon || [])
      }
    } catch (error) {
      console.error('Failed to fetch expiring soon properties:', error)
    }
  }

  const handleCleanupExpired = async () => {
    if (!confirm('Are you sure you want to mark all expired properties as "Off Market"? This action cannot be undone.')) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/cleanup-expired-properties', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully processed ${data.data.processedCount} expired properties`)
        await fetchStats()
        await fetchExpiredProperties()
      } else {
        alert(data.error || 'Failed to cleanup expired properties')
      }
    } catch (error) {
      console.error('Failed to cleanup expired properties:', error)
      alert('Error cleaning up expired properties')
    } finally {
      setProcessing(false)
    }
  }

  const handleCompleteRemoval = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will PERMANENTLY DELETE expired properties!\n\n' +
      'This action will:\n' +
      '• Remove properties from database\n' +
      '• Delete all images from Cloudflare R2\n' +
      '• Cannot be undone\n\n' +
      'Are you sure you want to proceed?'
    )
    
    if (!confirmed) return

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/remove-expired-properties', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        alert(
          `✅ Complete removal successful!\n\n` +
          `Properties removed: ${data.data.removedCount}\n` +
          `Files deleted from R2: ${data.data.filesDeleted}\n` +
          `Files failed to delete: ${data.data.filesFailed}\n` +
          `Errors: ${data.data.totalErrors}`
        )
        // Refresh data
        await Promise.all([
          fetchStats(),
          fetchExpiredProperties(),
          fetchExpiringSoonProperties()
        ])
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error in complete removal:', error)
      alert('Error in complete removal process')
    } finally {
      setProcessing(false)
    }
  }

  const handleMigrateExpirationDates = async () => {
    if (!confirm('Are you sure you want to add expiration dates to all properties that don\'t have them? This will set expiration dates based on creation date.')) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/migrate-expiration-dates', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`Successfully migrated ${data.data.processedCount} properties with expiration dates`)
        await fetchStats()
        await fetchExpiredProperties()
        await fetchExpiringSoonProperties()
      } else {
        alert(data.error || 'Failed to migrate expiration dates')
      }
    } catch (error) {
      console.error('Failed to migrate expiration dates:', error)
      alert('Error migrating expiration dates')
    } finally {
      setProcessing(false)
    }
  }

  // Authentication check
  useEffect(() => {
    console.log('🔍 Property Expiration useEffect - user:', user, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading)
    console.log('🔍 Property Expiration useEffect - user role:', user?.role, 'user id:', user?.id)
    
    if (authLoading) {
      console.log('⏳ Property Expiration - Auth still loading, waiting...')
      return
    }
    
    // Only redirect if we're sure the user is not authenticated after loading is complete
    if (!isAuthenticated && !authLoading) {
      console.log('❌ Property Expiration - Not authenticated after loading, redirecting to home')
      console.log('❌ Property Expiration - Redirect reason: !isAuthenticated && !authLoading')
      router.replace('/')
      return
    }
    
    if (isAuthenticated && user?.role === 'superadmin') {
      console.log('✅ Property Expiration - Superadmin detected, loading data')
      const loadData = async () => {
        setLoading(true)
        await Promise.all([
          fetchStats(),
          fetchExpiredProperties(),
          fetchExpiringSoonProperties()
        ])
        setLoading(false)
      }
      loadData()
    } else if (user && !authLoading && user.role !== 'superadmin') {
      // User is authenticated but not superadmin
      console.log('❌ Property Expiration - User is not superadmin, redirecting to home')
      console.log('❌ Property Expiration - User role:', user.role)
      router.replace('/')
    }
  }, [user, isAuthenticated, authLoading, router])

  const filteredExpiredProperties = expiredProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.district.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || property.listingType === filterType
    return matchesSearch && matchesType
  })

  const filteredExpiringSoonProperties = expiringSoonProperties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.district.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || property.listingType === filterType
    return matchesSearch && matchesType
  })

  // Show loading while authentication is being checked
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-600">
              {authLoading ? 'Checking authentication...' : 'Loading expiration data...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || user?.role !== 'superadmin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Expiration Management</h1>
          <p className="text-gray-600">Monitor and manage property expiration dates and cleanup expired listings</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={handleMigrateExpirationDates}
            disabled={processing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
            Migrate Expiration Dates
          </button>
          <button
            onClick={handleCleanupExpired}
            disabled={processing}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
            Mark as Off Market
          </button>
          <button
            onClick={handleCompleteRemoval}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <AlertTriangle className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
            🗑️ Complete Removal
          </button>
          <button
            onClick={() => {
              fetchStats()
              fetchExpiredProperties()
              fetchExpiringSoonProperties()
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Properties</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeProperties}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Properties</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expiredProperties}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiringSoonCount}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'expired', label: `Expired (${expiredProperties.length})`, icon: AlertTriangle },
                { id: 'expiring', label: `Expiring Soon (${expiringSoonProperties.length})`, icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Live Countdown Display */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Live Countdown Monitor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats?.expiredProperties || 0}</div>
                        <div className="text-sm text-gray-600">Expired Properties</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats?.expiringSoonCount || 0}</div>
                        <div className="text-sm text-gray-600">Expiring Soon</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats?.activeProperties || 0}</div>
                        <div className="text-sm text-gray-600">Active Properties</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Last updated: {currentTime.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Expiration Rules</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Rental Properties:</span>
                          <span className="font-medium text-blue-600">30 days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Sale Properties:</span>
                          <span className="font-medium text-green-600">90 days</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cleanup Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Needs Update:</span>
                          <span className={`font-medium ${stats?.needsExpirationUpdate ? 'text-red-600' : 'text-green-600'}`}>
                            {stats?.needsExpirationUpdate || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Cleanup Needed:</span>
                          <span className={`font-medium ${stats?.cleanupNeeded ? 'text-red-600' : 'text-green-600'}`}>
                            {stats?.cleanupNeeded ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'expired' && (
                <motion.div
                  key="expired"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Search and Filter */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                    </select>
                  </div>

                  {/* Expired Properties List */}
                  <div className="space-y-4">
                    {filteredExpiredProperties.map((property, index) => (
                      <motion.div
                        key={property._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{property.title}</h4>
                            <p className="text-sm text-gray-600">{property.location}, {property.district}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Property ID: {property.propertyId}</span>
                              <span>Type: {property.listingType}</span>
                              <span>Agent: {property.agentName}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium px-2 py-1 rounded-full ${getCountdownColor(property.expiresAt)}`}>
                              {formatCountdown(property.expiresAt)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Expired: {new Date(property.expiresAt).toLocaleDateString()}
                            </div>
                            <div className="mt-2">
                              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                Click to view details →
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredExpiredProperties.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No expired properties found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'expiring' && (
                <motion.div
                  key="expiring"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Search and Filter */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                    </select>
                  </div>

                  {/* Expiring Soon Properties List */}
                  <div className="space-y-4">
                    {filteredExpiringSoonProperties.map((property, index) => (
                      <motion.div
                        key={property._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{property.title}</h4>
                            <p className="text-sm text-gray-600">{property.location}, {property.district}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>Property ID: {property.propertyId}</span>
                              <span>Type: {property.listingType}</span>
                              <span>Agent: {property.agentName}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium px-2 py-1 rounded-full ${getCountdownColor(property.expiresAt)}`}>
                              {formatCountdown(property.expiresAt)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(property.expiresAt).toLocaleDateString()}
                            </div>
                            <div className="mt-2">
                              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                Click to view details →
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredExpiringSoonProperties.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No properties expiring soon
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Property Expiration Modal */}
      <PropertyExpirationModal
        isOpen={showExpirationModal}
        onClose={() => {
          setShowExpirationModal(false)
          setSelectedProperty(null)
        }}
        property={selectedProperty}
      />
    </div>
  )
}
