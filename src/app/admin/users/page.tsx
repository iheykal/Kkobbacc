'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/contexts/UserContext'
import { formatPhoneNumber, formatPrice } from '@/lib/utils'
import { propertyEventManager } from '@/lib/propertyEvents'
import { 
  Users, 
  User, 
  Crown, 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  MapPin,
  Home,
  BarChart3,
  Bed,
  Bath,
  Trash2,
  Star,
  DollarSign,
  Key,
  Settings
} from 'lucide-react'

// Lazy load heavy components - commented out until components are created
// const UserDetailsModal = React.lazy(() => import('./components/UserDetailsModal'))
// const PropertiesGrid = React.lazy(() => import('./components/PropertiesGrid'))

interface UserData {
  id: string
  fullName: string
  phone: string
  role: 'super_admin' | 'agent' | 'normal_user'
  status: string
  createdAt: string
  avatar?: string
  licenseNumber?: string
  agentProfile?: {
    licenseNumber?: string
    experience?: number
    specializations?: string[]
    commissionRate?: number
    totalSales?: number
    totalProperties?: number
    rating?: number
    verified: boolean
  }
  profile?: {
    bio?: string
    location?: string
    dateOfBirth?: string
    gender?: string
    occupation?: string
    company?: string
  }
  permissions?: {
    canManageUsers: boolean
    canManageProperties: boolean
    canManageAgents: boolean
    canViewAnalytics: boolean
    canManageSettings: boolean
    canApproveProperties: boolean
    canDeleteProperties: boolean
    canManageRoles: boolean
  }
}

interface StatsData {
  total: number
  active: number
  pending: number
  agents: number
  superAdmins: number
  normalUsers: number
}

// Ultimate superadmin protection constants
const ULTIMATE_SUPERADMIN_PHONE = '0610251014'
const ULTIMATE_SUPERADMIN_NAME = 'Kobac Real Estate'

// Helper function to check if user is ultimate superadmin
const isUltimateSuperadmin = (user: UserData) => {
  return user.phone === ULTIMATE_SUPERADMIN_PHONE || 
         user.fullName === ULTIMATE_SUPERADMIN_NAME ||
         user.fullName.toLowerCase().includes('kobac')
}

// Memoized components for better performance
const RoleIcon = React.memo(({ role, isUltimate }: { role: string; isUltimate?: boolean }) => {
  if (isUltimate) {
    return <Crown className="w-5 h-5 text-red-500" />
  }
  switch (role) {
    case 'super_admin': return <Crown className="w-5 h-5 text-yellow-500" />
    case 'agent': return <Shield className="w-5 h-5 text-blue-500" />
    case 'normal_user': return <User className="w-5 h-5 text-green-500" />
    default: return <User className="w-5 h-5 text-gray-500" />
  }
})

const StatusBadge = React.memo(({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return (
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </motion.span>
      )
    case 'pending_verification':
      return (
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </motion.span>
      )
    case 'suspended':
      return (
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Suspended
        </motion.span>
      )
    default:
      return (
        <motion.span 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          {status}
        </motion.span>
      )
  }
})

export default function UserManagementPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useUser()
  const [users, setUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [promoteData, setPromoteData] = useState({
    newRole: ''
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'agents' | 'properties'>('overview')
  const [properties, setProperties] = useState<any[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [deletingProperty, setDeletingProperty] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null)
  const [userToPromote, setUserToPromote] = useState<UserData | null>(null)
  const [promotingUser, setPromotingUser] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    pending: 0,
    agents: 0,
    superAdmins: 0,
    normalUsers: 0
  })

  // Map DB roles to UI roles - memoized
  const mapDbRoleToUi = useCallback((role: string): 'super_admin' | 'agent' | 'normal_user' => {
    switch (role) {
      case 'super_admin':
      case 'superadmin':
        return 'super_admin'
      case 'agent':
      case 'agency':
        return 'agent'
      case 'normal_user':
      case 'user':
      default:
        return 'normal_user'
    }
  }, [])

  // Calculate stats from users data - memoized
  const calculateStats = useCallback((usersData: UserData[]): StatsData => {
    return {
      total: usersData.length,
      active: usersData.filter(u => u.status === 'active').length,
      pending: usersData.filter(u => u.status === 'pending_verification').length,
      agents: usersData.filter(u => u.role === 'agent').length,
      superAdmins: usersData.filter(u => u.role === 'super_admin').length,
      normalUsers: usersData.filter(u => u.role === 'normal_user').length
    }
  }, [])

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.phone.includes(searchTerm)
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  // Memoized non-agent users for overview
  const nonAgentUsers = useMemo(() => {
    return filteredUsers.filter(user => user.role !== 'agent')
  }, [filteredUsers])

  // Memoized agent users
  const agentUsers = useMemo(() => {
    return users.filter(u => u.role === 'agent')
  }, [users])

  // Memoized filtered agent users for search
  const filteredAgentUsers = useMemo(() => {
    if (!searchTerm) return agentUsers
    
    return agentUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const nameMatch = user.fullName.toLowerCase().includes(searchLower)
      const phoneMatch = user.phone.includes(searchTerm)
      const locationMatch = user.profile?.location?.toLowerCase().includes(searchLower)
      
      return nameMatch || phoneMatch || locationMatch
    })
  }, [agentUsers, searchTerm])

  const handleCardClick = useCallback((user: UserData) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }, [])

  // Fetch users with error handling and caching
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const json = await res.json()
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || 'Failed to load users')
      }
      const apiUsers = json.data as any[]
      const mapped: UserData[] = apiUsers.map((u: any) => ({
        id: String(u._id),
        fullName: u.fullName,
        phone: u.phone,
        role: mapDbRoleToUi(u.role),
        status: u.status,
        createdAt: u.createdAt,
        avatar: u?.profile?.avatar,
        licenseNumber: u?.agentProfile?.licenseNumber,
        agentProfile: u?.agentProfile ? {
          licenseNumber: u.agentProfile.licenseNumber,
          experience: u.agentProfile.experience,
          specializations: u.agentProfile.specializations,
          commissionRate: u.agentProfile.commissionRate,
          totalSales: u.agentProfile.totalSales,
          totalProperties: u.agentProfile.totalProperties,
          rating: u.agentProfile.rating,
          verified: u.agentProfile.verified
        } : undefined,
        profile: u?.profile ? {
          bio: u.profile.bio,
          location: u.profile.location,
          dateOfBirth: u.profile.dateOfBirth,
          gender: u.profile.gender,
          occupation: u.profile.occupation,
          company: u.profile.company
        } : undefined,
        permissions: u.permissions || {
          canManageUsers: false,
          canManageProperties: false,
          canManageAgents: false,
          canViewAnalytics: false,
          canManageSettings: false,
          canApproveProperties: false,
          canDeleteProperties: false,
          canManageRoles: false
        }
      }))
      setUsers(mapped)
      setStats(calculateStats(mapped))
    } catch (e) {
      console.error('Failed to fetch users', e)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [mapDbRoleToUi, calculateStats])

  // Fetch properties with lazy loading
  const fetchProperties = useCallback(async () => {
    if (activeTab !== 'properties') return
    
    setIsLoadingProperties(true)
    try {
      const res = await fetch('/api/properties?limit=200&sort=latest', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'x-admin-request': 'true' // Signal this is an admin request to bypass filters
        }
      })
      const json = await res.json()
      if (!res.ok || !json?.data) {
        throw new Error(json?.error || 'Failed to load properties')
      }
      setProperties(json.data)
    } catch (e) {
      console.error('Failed to fetch properties', e)
    } finally {
      setIsLoadingProperties(false)
    }
  }, [activeTab])

  const handleDirectDeleteProperty = useCallback(async (propertyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this property? This action cannot be undone and will remove all data from the system.')) {
      return
    }

    try {
      setDeletingProperty(propertyId)
      const res = await fetch(`/api/properties/${propertyId}/direct-delete`, {
        method: 'POST',
        credentials: 'include'
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        setProperties(prev => prev.filter(p => p._id !== propertyId))
        // Notify other components about the deletion
        propertyEventManager.notifyDeleted(propertyId)
        alert('Property deleted successfully!')
      } else {
        alert(json?.error || 'Failed to delete property')
      }
    } catch (e) {
      console.error('Failed to delete property', e)
      alert('Error deleting property')
    } finally {
      setDeletingProperty(null)
    }
  }, [])

  const handleDeleteUser = useCallback(async (user: UserData) => {
    // Prevent deletion attempts for ultimate superadmin
    if (isUltimateSuperadmin(user)) {
      alert('Cannot delete the ultimate superadmin. This account is protected.')
      return
    }
    setUserToDelete(user)
    setShowDeleteUserModal(true)
  }, [])

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return

    try {
      setDeletingUser(userToDelete.id)
      const res = await fetch(`/api/admin/users/${userToDelete.id}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id))
        setStats(calculateStats(users.filter(u => u.id !== userToDelete.id)))
        alert(`Agent ${userToDelete.fullName} has been completely removed from the system. They can no longer login, but new users can register with the same phone number.`)
      } else {
        alert(json?.error || 'Failed to delete user')
      }
    } catch (e) {
      console.error('Failed to delete user', e)
      alert('Error deleting user')
    } finally {
      setDeletingUser(null)
      setShowDeleteUserModal(false)
      setUserToDelete(null)
    }
  }, [userToDelete, users, calculateStats])

  const handlePromoteUser = useCallback(async (user: UserData) => {
    // Prevent promotion attempts for ultimate superadmin
    if (isUltimateSuperadmin(user)) {
      alert('Cannot modify the ultimate superadmin. This account is protected.')
      return
    }
    setUserToPromote(user)
    setShowPromoteModal(true)
  }, [])

  const confirmPromoteUser = useCallback(async (newRole: string) => {
    if (!userToPromote) return

    console.log('🔍 Promoting user:', userToPromote.fullName, 'to role:', newRole)

    try {
      setPromotingUser(userToPromote.id)
      const res = await fetch(`/api/admin/users/${userToPromote.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })
      const json = await res.json()
      
      console.log('🔍 API Response:', json)
      
      if (res.ok && json) {
        // Update the user in the local state
        const updatedRole = mapDbRoleToUi(json.role)
        setUsers(prev => prev.map(u => 
          u.id === userToPromote.id 
            ? { ...u, role: updatedRole, status: json.status }
            : u
        ))
        setStats(calculateStats(users.map(u => 
          u.id === userToPromote.id 
            ? { ...u, role: updatedRole, status: json.status }
            : u
        )))
        alert(`User ${userToPromote.fullName} has been promoted to ${newRole.replace('_', ' ')}`)
      } else {
        alert(json?.error || 'Failed to promote user')
      }
    } catch (e) {
      console.error('Failed to promote user', e)
      alert('Error promoting user')
    } finally {
      setPromotingUser(null)
      setShowPromoteModal(false)
      setUserToPromote(null)
    }
  }, [userToPromote, users, calculateStats])

  // Handle avatar management
  const handleSetAvatarClick = useCallback(async (user: UserData) => {
    setSelectedUser(user)
    setShowAvatarModal(true)
  }, [])

  const handleSetAvatar = useCallback(async () => {
    if (!selectedUser || (!avatarUrl && !avatarFile)) return

    try {
      let finalAvatarUrl = avatarUrl

      // If a file was uploaded, we need to create a special upload for superadmin
      if (avatarFile) {
        // Create a special form data for superadmin upload
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('agentId', selectedUser.id)
        formData.append('isSuperadminUpload', 'true') // Flag to bypass user check

        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Upload failed: ${errorText}`)
        }

        const uploadResult = await uploadResponse.json()
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed')
        }

        finalAvatarUrl = uploadResult.url
      }

      // Update the user's avatar
      const res = await fetch(`/api/admin/users/${selectedUser.id}/avatar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ avatar: finalAvatarUrl })
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        // Update the user in the local state
        setUsers(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, avatar: finalAvatarUrl }
            : u
        ))
        alert(`Profile picture updated successfully for ${selectedUser.fullName}`)
        setShowAvatarModal(false)
        setSelectedUser(null)
        setAvatarUrl('')
        setAvatarFile(null)
      } else {
        alert(json?.error || 'Failed to update profile picture')
      }
    } catch (e) {
      console.error('Failed to update profile picture', e)
      alert('Error updating profile picture')
    }
  }, [selectedUser, avatarUrl, avatarFile, users])

  // Fetch users on mount
  useEffect(() => {
    console.log('🔍 Users useEffect - user:', user, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading)
    console.log('🔍 Users useEffect - user role:', user?.role, 'user id:', user?.id)
    
    if (authLoading) {
      console.log('⏳ Users - Auth still loading, waiting...')
      return
    }
    
    // Only redirect if we're sure the user is not authenticated after loading is complete
    if (!isAuthenticated && !authLoading) {
      console.log('❌ Users - Not authenticated after loading, redirecting to home')
      console.log('❌ Users - Redirect reason: !isAuthenticated && !authLoading')
      router.replace('/')
      return
    }
    
    if (isAuthenticated && user?.role === 'superadmin') {
      console.log('✅ Users - Superadmin detected, fetching users')
      fetchUsers()
    } else if (user && !authLoading && user.role !== 'superadmin') {
      // User is authenticated but not superadmin
      console.log('❌ Users - Access denied for role:', user.role)
      console.log('❌ Users - Redirect reason: Invalid role -', user.role)
      router.replace('/')
    } else {
      console.log('🔍 Users - No action taken, state:', { user: !!user, isAuthenticated, authLoading })
    }
  }, [authLoading, isAuthenticated, user?.role, router, fetchUsers])

  // Fetch properties when tab changes
  useEffect(() => {
    if (activeTab === 'properties' && isAuthenticated && user?.role === 'superadmin') {
      fetchProperties()
    }
  }, [activeTab, isAuthenticated, user?.role, fetchProperties])

  // Show loading while authentication is being checked
  if (authLoading || isLoadingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header with Glassmorphism */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
              >
                User Management
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="text-lg font-semibold text-blue-600"
              >
                Kobac Real Estate
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-600 mt-2"
              >
                Manage all users, roles, and permissions with advanced analytics
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-4"
            >
              <button 
                onClick={fetchUsers}
                className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex rounded-2xl bg-white/80 backdrop-blur-sm p-2 border border-white/20 shadow-lg">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'properties', label: 'Properties', icon: Home }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
          }>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back, Super Admin! 👋</h2>
                    <p className="text-blue-100 text-lg">Manage your real estate platform with powerful tools and insights</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/admin/fix-avatars"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fix Avatar URLs
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/fix-dicebear-avatars', {
                          method: 'POST',
                          credentials: 'include'
                        })
                        const result = await response.json()
                        if (result.success) {
                          alert(`✅ ${result.message}\nUpdated ${result.data.updatedCount} users`)
                          // Refresh the users list
                          window.location.reload()
                        } else {
                          alert(`❌ Error: ${result.error}`)
                        }
                      } catch (error) {
                        alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fix DiceBear URLs
                  </button>
                  <span className="text-sm text-gray-600 flex items-center">
                    Fix all old avatar URLs to use default avatar
                  </span>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('overview')}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Total Users</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        {stats.total}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Users />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab('overview')
                    setStatusFilter('active')
                  }}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Active Users</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        {stats.active}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <CheckCircle />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setActiveTab('overview')
                    setStatusFilter('pending_verification')
                  }}
                  className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Pending</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        {stats.pending}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Clock />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    document.querySelector('[data-agents-section]')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Agents</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {stats.agents}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Shield />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Advanced Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Advanced Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Roles</option>
                      <option value="super_admin">Super Admin</option>
                      <option value="agent">Agent</option>
                      <option value="normal_user">Normal User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending_verification">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Users Grid */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    All Users
                  </h2>
                  <span className="text-sm text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                    {nonAgentUsers.length} users
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {nonAgentUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative cursor-pointer"
                        onClick={() => handleCardClick(user)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                          {/* User Profile Section */}
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="relative mb-3">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                                <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                                  {user.role === 'agent' && user.avatar ? (
                                    <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl font-bold text-gray-600">
                                      {user.fullName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="absolute -top-2 -right-2">
                                <RoleIcon role={user.role} isUltimate={isUltimateSuperadmin(user)} />
                              </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {user.fullName}
                              {isUltimateSuperadmin(user) && (
                                <div className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white border border-blue-500 shadow-lg">
                                  <div className="relative">
                                    <Shield className="w-3 h-3 text-white drop-shadow-sm" />
                                    <Crown className="w-2 h-2 text-yellow-300 absolute -top-0.5 -right-0.5" />
                                  </div>
                                  <span>ULTIMATE SUPERADMIN</span>
                                </div>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 flex items-center justify-center">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {formatPhoneNumber(user.phone)}
                            </p>
                            <div className="mb-3">
                              <StatusBadge status={user.status} />
                            </div>
                          </div>
                          
                          {/* User Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <span className="text-xs font-medium text-gray-600">Role</span>
                              <span className="text-xs font-semibold text-gray-900 capitalize">{user.role.replace('_', ' ')}</span>
                            </div>
                            {user.licenseNumber && (
                              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
                                <span className="text-xs font-medium text-blue-600">License</span>
                                <span className="text-xs font-semibold text-blue-900">{user.licenseNumber}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedUser(user)
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4 inline mr-1" />
                              View
                            </button>
                            
                            {/* Set Avatar Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetAvatarClick(user)
                              }}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm font-medium"
                            >
                              <User className="w-4 h-4 inline mr-1" />
                              Set Avatar
                            </button>
                            
                            {/* Disable Edit Role button for ultimate superadmin */}
                            {!isUltimateSuperadmin(user) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePromoteUser(user)
                                }}
                                className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm font-medium"
                              >
                                <Edit className="w-4 h-4 inline mr-1" />
                                Edit Role
                              </button>
                            ) : (
                              <button
                                disabled
                                className="flex-1 px-3 py-2 rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed text-sm font-medium"
                                title="Ultimate superadmin cannot be modified"
                              >
                                <Edit className="w-4 h-4 inline mr-1" />
                                Protected
                              </button>
                            )}
                            
                            {/* Disable Delete button for ultimate superadmin */}
                            {user.role === 'agent' && !isUltimateSuperadmin(user) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteUser(user)
                                }}
                                disabled={deletingUser === user.id}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Agent"
                              >
                                {deletingUser === user.id ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                  />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            
                            {/* Show protection indicator for ultimate superadmin */}
                            {isUltimateSuperadmin(user) && (
                              <button
                                disabled
                                className="px-3 py-2 rounded-lg bg-red-100 text-red-600 cursor-not-allowed text-sm font-medium"
                                title="Ultimate superadmin cannot be deleted"
                              >
                                🛡️ Protected
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Revolutionary Agents Summary Dashboard */}
              <div data-agents-section className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
                {/* Header Section */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col lg:flex-row lg:items-center justify-between mb-8"
                >
                  <div className="mb-6 lg:mb-0">
                    <h2 className="text-4xl font-bold text-white mb-2 flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      Agent Command Center
                  </h2>
                    <p className="text-blue-200 text-lg">Advanced agent management and analytics dashboard</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {/* Advanced Search */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search by name, phone number, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200 w-full sm:w-80 transition-all duration-300"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Quick Stats Badge */}
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white font-semibold">{agentUsers.length}</span>
                      <span className="text-blue-200 text-sm">Active Agents</span>
                  </div>
                </div>
                </motion.div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Agent Analytics Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-1 space-y-6"
                  >
                    {/* Performance Metrics */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">📊</span>
                        </div>
                        Performance Metrics
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-blue-200 text-sm">Active Agents</span>
                          </div>
                          <span className="text-white font-bold text-lg">{agentUsers.filter(u => u.status === 'active').length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-blue-200 text-sm">Pending Verification</span>
                          </div>
                          <span className="text-white font-bold text-lg">{agentUsers.filter(u => u.status === 'pending_verification').length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span className="text-blue-200 text-sm">Verified</span>
                          </div>
                          <span className="text-white font-bold text-lg">{agentUsers.filter(u => u.agentProfile?.verified).length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-200 text-sm">Total Properties</span>
                          </div>
                          <span className="text-white font-bold text-lg">{agentUsers.reduce((acc, u) => acc + (u.agentProfile?.totalProperties || 0), 0)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                            <span className="text-blue-200 text-sm">Avg Properties/Agent</span>
                          </div>
                          <span className="text-white font-bold text-lg">
                            {agentUsers.length > 0 ? Math.round(agentUsers.reduce((acc, u) => acc + (u.agentProfile?.totalProperties || 0), 0) / agentUsers.length) : 0}
                    </span>
                        </div>
                  </div>
                </div>

                    {/* Top Performers */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">🏆</span>
                        </div>
                        Top Performers
                      </h3>
                      
                      <div className="space-y-3">
                        {agentUsers
                          .filter(u => u.agentProfile?.rating)
                          .sort((a, b) => (b.agentProfile?.rating || 0) - (a.agentProfile?.rating || 0))
                          .slice(0, 5)
                          .map((user, index) => (
                <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                              onClick={() => handleCardClick(user)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors">
                                    {user.fullName}
                                  </p>
                                  <p className="text-blue-200 text-xs">{user.agentProfile?.totalProperties || 0} properties • {user.agentProfile?.experience || 0} years exp</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-yellow-400 text-sm font-bold">⭐ {user.agentProfile?.rating}/5</span>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2">
                        <span>📈</span>
                        <span>View Analytics</span>
                      </button>
                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2">
                        <span>➕</span>
                        <span>Add New Agent</span>
                      </button>
                    </div>
                  </motion.div>

                  {/* Agent Directory */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="xl:col-span-3"
                  >
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        Agent Directory
                      </h3>
                        
                        {/* Filter Controls */}
                        <div className="flex items-center space-x-3">
                          <select className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="all" className="bg-slate-800">All Agents</option>
                            <option value="active" className="bg-slate-800">Active Only</option>
                            <option value="pending" className="bg-slate-800">Pending</option>
                            <option value="verified" className="bg-slate-800">Verified</option>
                          </select>
                          
                          <select className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="name" className="bg-slate-800">Sort by Name</option>
                            <option value="rating" className="bg-slate-800">Sort by Rating</option>
                            <option value="properties" className="bg-slate-800">Sort by Properties</option>
                            <option value="date" className="bg-slate-800">Sort by Date</option>
                          </select>
                        </div>
                        </div>

                      {/* Search Results Info */}
                      {searchTerm ? (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <p className="text-blue-200 text-sm">
                            <span className="font-semibold">{filteredAgentUsers.length}</span> agents found for "{searchTerm}"
                          </p>
                          {filteredAgentUsers.length === 0 && (
                            <p className="text-yellow-300 text-xs mt-1">
                              💡 Try searching by name, phone number, or location
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                          <p className="text-green-200 text-sm">
                            <span className="font-semibold">{agentUsers.length}</span> total agents available
                          </p>
                        </div>
                      )}

                      {/* Agent Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {filteredAgentUsers.map((user, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -5 }}
                              whileTap={{ scale: 0.98 }}
                              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                              onClick={() => handleCardClick(user)}
                            >
                              {/* Background Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              {/* Agent Info */}
                              <div className="relative z-10">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 p-[3px] group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-full h-full rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center">
                                    {user.avatar ? (
                                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-xl">
                                        {user.fullName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                  <div className="flex-1">
                                    <h4 className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors">
                                    {user.fullName}
                                  </h4>
                                    <p className="text-blue-200 text-sm flex items-center">
                                      <span className="mr-2">📞</span>
                                      {formatPhoneNumber(user.phone)}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                <StatusBadge status={user.status} />
                                      {user.agentProfile?.verified && (
                                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                                          ✓ Verified
                                        </span>
                                      )}
                              </div>
                      </div>
                    </div>

                                {/* Performance Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                  <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-blue-200 text-xs mb-1">Properties</p>
                                    <p className="text-white font-bold text-lg">{user.agentProfile?.totalProperties || 0}</p>
                                    <p className="text-blue-300 text-xs">Listed</p>
                        </div>
                                  <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-blue-200 text-xs mb-1">Rating</p>
                                    <p className="text-white font-bold text-lg flex items-center justify-center">
                                      ⭐ {user.agentProfile?.rating || 'N/A'}
                                    </p>
                                    <p className="text-blue-300 text-xs">Stars</p>
                        </div>
                                  <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-blue-200 text-xs mb-1">Experience</p>
                                    <p className="text-white font-bold text-lg">{user.agentProfile?.experience || 0}</p>
                                    <p className="text-blue-300 text-xs">Years</p>
                        </div>
                      </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2">
                                  <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-300 border border-blue-500/30">
                                    View Profile
                                  </button>
                                  <button className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-all duration-300">
                                    <span className="text-sm">⚙️</span>
                      </button>
                              </div>
                  </div>
                </motion.div>
                            ))}
                        </div>
                      </div>
                  </motion.div>
                    </div>
              </div>
            </motion.div>
          </Suspense>
        )}

        {/* Properties Dashboard */}
        {activeTab === 'properties' && (
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
          }>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Properties Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Properties Management 🏠</h2>
                    <p className="text-green-100 text-lg">Manage all property listings across the platform</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => fetchProperties()}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 shadow-lg"
                      title="Refresh properties"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    <div className="hidden md:block">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Properties Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Total Properties</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      >
                        {properties.length}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Home />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Featured</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        {properties.filter(p => p.featured).length}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Star />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">For Sale</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        {properties.filter(p => p.listingType === 'sale').length}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <DollarSign />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">For Rent</p>
                      <motion.p 
                        className="text-3xl font-bold mt-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {properties.filter(p => p.listingType === 'rent').length}
                      </motion.p>
                    </div>
                    <div className="text-4xl opacity-80">
                      <Key />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Properties List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">All Properties</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                </div>

                {isLoadingProperties ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                    />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No properties found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties
                      .filter(property => {
                        const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             property.district.toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesType = roleFilter === 'all' || property.listingType === roleFilter
                        return matchesSearch && matchesType
                      })
                      .map((property) => (
                        <motion.div
                          key={property._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
                        >
                          <div className="relative">
                            <img
                              src={property.thumbnailImage || property.images?.[0] || 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=No+Image'}
                              alt={property.title}
                              className="w-full h-48 object-cover"
                            />
                            {property.featured && (
                              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                Featured
                              </div>
                            )}
                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              {property.listingType === 'sale' ? 'Sale' : 'Rent'}
                            </div>
                            {/* Expiration Status Badge */}
                            {property.expiresAt && (
                              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                property.isExpired 
                                  ? 'bg-red-500 text-white' 
                                  : new Date(property.expiresAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-green-500 text-white'
                              }`}>
                                {property.isExpired 
                                  ? 'Expired' 
                                  : (() => {
                                      const diff = new Date(property.expiresAt).getTime() - Date.now()
                                      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                                      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                                      
                                      if (days > 0) return `${days}d`
                                      if (hours > 0) return `${hours}h`
                                      if (minutes > 0) return `${minutes}m`
                                      if (seconds > 0) return `${seconds}s`
                                      return 'Expiring'
                                    })()
                                }
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h4>
                            <p className="text-gray-600 text-sm mb-3 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {property.location}, {property.district}
                            </p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Bed className="w-4 h-4 mr-1" />
                                  {property.beds}
                                </span>
                                <span className="flex items-center">
                                  <Bath className="w-4 h-4 mr-1" />
                                  {property.baths}
                                </span>
                                {property.status === 'For Sale' && property.measurement && (
                                  <span className="flex items-center">
                                    <img 
                                      src="/icons/ruler.gif" 
                                      alt="Measurement" 
                                      className="w-4 h-4 mr-1 object-contain"
                                    />
                                    {property.measurement}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Expiration Details */}
                            {property.expiresAt && (
                              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Expires:</span>
                                  <span className={`font-medium ${
                                    property.isExpired 
                                      ? 'text-red-600' 
                                      : new Date(property.expiresAt).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                  }`}>
                                    {(() => {
                                      const diff = new Date(property.expiresAt).getTime() - Date.now()
                                      if (diff <= 0) return 'Expired'
                                      
                                      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
                                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                                      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                                      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
                                      
                                      const parts = []
                                      if (days > 0) parts.push(`${days}d`)
                                      if (hours > 0) parts.push(`${hours}h`)
                                      if (minutes > 0) parts.push(`${minutes}m`)
                                      if (seconds > 0) parts.push(`${seconds}s`)
                                      
                                      return parts.length > 0 ? parts.join(' ') : 'Expiring now'
                                    })()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                  <span>Date:</span>
                                  <span>{new Date(property.expiresAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                ${property.price.toLocaleString()}
                              </span>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.open(`/property/${property._id}`, '_blank')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Property"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDirectDeleteProperty(property._id)}
                                  disabled={deletingProperty === property._id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete Property"
                                >
                                  {deletingProperty === property._id ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </Suspense>
        )}

        {/* User Details Modal */}
        {showUserDetailsModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Profile Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                      <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                        {selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-gray-600">
                            {selectedUser.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedUser.fullName}
                      {isUltimateSuperadmin(selectedUser) && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          🛡️ Ultimate Superadmin
                        </span>
                      )}
                    </h4>
                    <p className="text-gray-600">{formatPhoneNumber(selectedUser.phone)}</p>
                    <div className="mt-2">
                      <StatusBadge status={selectedUser.status} />
                    </div>
                    
                    {/* Ultimate Superadmin Protection Notice */}
                    {isUltimateSuperadmin(selectedUser) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-red-800">
                          <Shield className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Ultimate Protection Active</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          This account is protected and cannot be deleted or modified by any other user.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Basic Information</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium capitalize">{selectedUser.role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{selectedUser.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Joined:</span>
                        <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Profile (if applicable) */}
                  {selectedUser.role === 'agent' && selectedUser.agentProfile && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Agent Profile</h5>
                      <div className="space-y-2">
                        {selectedUser.agentProfile.licenseNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">License:</span>
                            <span className="font-medium">{selectedUser.agentProfile.licenseNumber}</span>
                          </div>
                        )}
                        {selectedUser.agentProfile.experience && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Experience:</span>
                            <span className="font-medium">{selectedUser.agentProfile.experience} years</span>
                          </div>
                        )}
                        {selectedUser.agentProfile.rating && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rating:</span>
                            <span className="font-medium">⭐ {selectedUser.agentProfile.rating}/5</span>
                          </div>
                        )}
                        {selectedUser.agentProfile.totalSales && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Sales:</span>
                            <span className="font-medium">{selectedUser.agentProfile.totalSales}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verified:</span>
                          <span className={`font-medium ${selectedUser.agentProfile.verified ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedUser.agentProfile.verified ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Details */}
                <div className="space-y-4">
                  {selectedUser.profile && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Profile Details</h5>
                      <div className="space-y-2">
                        {selectedUser.profile.bio && (
                          <div>
                            <span className="text-gray-600 block mb-1">Bio:</span>
                            <p className="text-sm text-gray-800">{selectedUser.profile.bio}</p>
                          </div>
                        )}
                        {selectedUser.profile.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{selectedUser.profile.location}</span>
                          </div>
                        )}
                        {selectedUser.profile.occupation && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Occupation:</span>
                            <span className="font-medium">{selectedUser.profile.occupation}</span>
                          </div>
                        )}
                        {selectedUser.profile.company && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Company:</span>
                            <span className="font-medium">{selectedUser.profile.company}</span>
                          </div>
                        )}
                        {selectedUser.profile.gender && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gender:</span>
                            <span className="font-medium capitalize">{selectedUser.profile.gender}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Permissions */}
                  {selectedUser.permissions && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">Permissions</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedUser.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Actions</h5>
                    <div className="space-y-2">
                      {/* Avatar Management - Available for all users */}
                      <button
                        onClick={() => {
                          setShowUserDetailsModal(false)
                          handleSetAvatarClick(selectedUser)
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 text-sm font-medium"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Set Profile Picture
                      </button>
                      
                      {/* Disable actions for ultimate superadmin */}
                      {!isUltimateSuperadmin(selectedUser) ? (
                        <>
                          <button
                            onClick={() => {
                              setShowUserDetailsModal(false)
                              handlePromoteUser(selectedUser)
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Edit className="w-4 h-4 inline mr-2" />
                            Edit Role
                          </button>
                          {selectedUser.role === 'agent' && (
                            <button
                              onClick={() => {
                                setShowUserDetailsModal(false)
                                handleDeleteUser(selectedUser)
                              }}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4 inline mr-2" />
                              Delete Agent
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <button
                            disabled
                            className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                          >
                            <Shield className="w-4 h-4 inline mr-2" />
                            Role Protected
                          </button>
                          <button
                            disabled
                            className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                          >
                            <Shield className="w-4 h-4 inline mr-2" />
                            Account Protected
                          </button>
                          <div className="text-xs text-gray-500 text-center mt-2">
                            Ultimate superadmin cannot be modified
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
                 )}

         {/* Role Promotion Modal */}
         {showPromoteModal && userToPromote && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
             >
               <div className="text-center">
                 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                   <Edit className="w-8 h-8 text-blue-600" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Edit User Role</h3>
                 <p className="text-gray-600 mb-4">
                   Change role for <span className="font-semibold text-blue-600">{userToPromote.fullName}</span>
                 </p>
                 
                 <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                   <h4 className="font-semibold text-gray-800 mb-3">Current Role: <span className="text-blue-600 capitalize">{userToPromote.role.replace('_', ' ')}</span></h4>
                   <div className="space-y-3">
                     <button
                       onClick={() => confirmPromoteUser('user')}
                       disabled={promotingUser === userToPromote.id || userToPromote.role === 'normal_user'}
                       className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 text-left ${
                         userToPromote.role === 'normal_user'
                           ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                           : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="font-semibold">Normal User</div>
                           <div className="text-sm text-gray-600">Basic user with limited permissions</div>
                         </div>
                         {userToPromote.role === 'normal_user' && (
                           <div className="text-green-600">✓ Current</div>
                         )}
                       </div>
                     </button>
                     
                     <button
                       onClick={() => confirmPromoteUser('agency')}
                       disabled={promotingUser === userToPromote.id || userToPromote.role === 'agent'}
                       className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 text-left ${
                         userToPromote.role === 'agent'
                           ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed'
                           : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="font-semibold">Agent</div>
                           <div className="text-sm text-gray-600">Can manage properties and listings</div>
                         </div>
                         {userToPromote.role === 'agent' && (
                           <div className="text-blue-600">✓ Current</div>
                         )}
                       </div>
                     </button>
                     
                     <button
                       onClick={() => confirmPromoteUser('superadmin')}
                       disabled={promotingUser === userToPromote.id || userToPromote.role === 'super_admin'}
                       className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 text-left ${
                         userToPromote.role === 'super_admin'
                           ? 'bg-purple-50 border-purple-200 text-purple-700 cursor-not-allowed'
                           : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="font-semibold">Super Admin</div>
                           <div className="text-sm text-gray-600">Full system access and control</div>
                         </div>
                         {userToPromote.role === 'super_admin' && (
                           <div className="text-purple-600">✓ Current</div>
                         )}
                       </div>
                     </button>
                   </div>
                 </div>
                 
                 <div className="flex space-x-3">
                   <button
                     onClick={() => {
                       setShowPromoteModal(false)
                       setUserToPromote(null)
                     }}
                     className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                   >
                     Cancel
                   </button>
                 </div>
               </div>
             </motion.div>
           </div>
         )}

         {/* Delete User Confirmation Modal */}
        {showDeleteUserModal && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Agent</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to <strong>permanently delete</strong> agent{' '}
                  <span className="font-semibold text-red-600">{userToDelete.fullName}</span>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-red-800 mb-2">⚠️ This action will:</h4>
                  <ul className="text-sm text-red-700 space-y-1 text-left">
                    <li>• Completely remove the agent from the database</li>
                    <li>• Delete all their properties permanently</li>
                    <li>• Prevent them from logging in ever again</li>
                    <li>• Allow new users to register with the same phone number</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteUserModal(false)
                      setUserToDelete(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={deletingUser === userToDelete.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingUser === userToDelete.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"
                      />
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Avatar Management Modal */}
        {showAvatarModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Set Profile Picture</h3>
                <p className="text-gray-600 mb-4">
                  Set profile picture for <span className="font-semibold text-purple-600">{selectedUser.fullName}</span>
                </p>
                
                {/* Current Avatar Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Current Profile Picture</h4>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                      <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                        {selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-gray-600">
                            {selectedUser.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedUser.avatar ? 'Profile picture is set' : 'No profile picture set'}
                  </p>
                </div>

                {/* Avatar Options */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Set Default Avatar</h4>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setAvatarUrl('/icons/uze.png')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                    >
                      <div className="text-sm font-semibold text-gray-800 mb-2">Default Avatar</div>
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Or Upload from Device</h4>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Validate file type
                          if (!file.type.startsWith('image/')) {
                            alert('Please select an image file (JPG, PNG, WebP)')
                            return
                          }

                          // Validate file size (max 5MB)
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size must be less than 5MB')
                            return
                          }

                          setAvatarFile(file)
                          // Create a preview URL
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            setAvatarUrl(e.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    <p className="text-xs text-gray-600">
                      Supported formats: JPG, PNG, WebP (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {avatarUrl && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Preview</h4>
                    <div className="flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 p-[3px] shadow-lg">
                        <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                          <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowAvatarModal(false)
                      setSelectedUser(null)
                      setAvatarUrl('')
                      setAvatarFile(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetAvatar}
                    disabled={!avatarUrl && !avatarFile}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Avatar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
} 
