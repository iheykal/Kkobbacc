'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Settings, Camera, ArrowLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import ProfilePictureUpload from '@/components/agent/ProfilePictureUpload'
import Link from 'next/link'

export default function AgentProfilePage() {
  const { user, isAuthenticated, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setError('You need to be logged in to access this page')
    }
  }, [isAuthenticated, isLoading])

  if (isLoading) {
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
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'agent' && user.role !== 'agency' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access the agent profile page.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/agent"
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Agent Profile</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="space-y-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">
                    {user.role === 'superadmin' ? 'Profile Picture' : 'Profile Info'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg"
            >
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {user.role === 'superadmin' ? 'Profile Picture' : 'Profile Information'}
                  </h2>
                  {user.role === 'superadmin' ? (
                    <ProfilePictureUpload />
                  ) : (
                    <div className="space-y-6">
                      {/* Current Profile Picture Display */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-white border-2 border-gray-200 p-[3px] shadow-lg">
                            <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
                              {user?.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.firstName || 'Profile'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Silent error handling
                                  }}
                                />
                              ) : (
                                <User className="w-12 h-12 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </h3>
                          <p className="text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Profile picture managed by superadmin
                          </p>
                        </div>
                      </div>

                      {/* Information Card */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Camera className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                              Profile Picture Management
                            </h3>
                            <p className="text-blue-700 text-sm leading-relaxed">
                              Your profile picture is managed by the superadmin. To change your profile picture, 
                              please contact the superadmin through the admin dashboard. This ensures consistency 
                              and proper verification of agent profiles.
                            </p>
                            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                              <p className="text-blue-800 text-xs font-medium">
                                💡 <strong>How to request a profile picture change:</strong>
                              </p>
                              <ul className="text-blue-700 text-xs mt-1 space-y-1">
                                <li>• Contact the superadmin directly</li>
                                <li>• Provide your new profile picture</li>
                                <li>• The superadmin will update it for you</li>
                                <li>• Changes will be reflected immediately</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border">
                              {user.phone}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border">
                              {user.phone}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border capitalize">
                              {user.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border">
                            {user.phone}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <p className="text-gray-900 bg-white px-3 py-2 rounded-lg border capitalize">
                            {user.role.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Coming Soon */}
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">More Features Coming Soon</h3>
                      <p className="text-blue-700 text-sm">
                        We're working on adding more profile customization options including bio, 
                        contact preferences, and notification settings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
