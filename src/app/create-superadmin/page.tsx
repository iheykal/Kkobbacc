'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Shield, Users, Building2, BarChart3, Settings } from 'lucide-react'

export default function CreateSuperAdminPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminToken: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/auth/create-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: '+252' + formData.phone,
          password: formData.password,
          adminToken: formData.adminToken
        }),
      })
      
      const result = await response.json()
      setResult({ status: response.status, success: response.ok, data: result })
      
      if (result.success) {
        alert('🎉 SuperAdmin created successfully! You can now log in with full system access.')
      }
      
    } catch (error) {
              setResult({ status: 'ERROR', success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setIsLoading(false)
    }
  }

  const superAdminPermissions = [
    { icon: Users, title: 'Manage Users', description: 'Create, edit, and delete user accounts' },
    { icon: Building2, title: 'Manage Properties', description: 'Full control over all property listings' },
    { icon: Shield, title: 'Manage Agents', description: 'Approve and manage real estate agents' },
    { icon: BarChart3, title: 'View Analytics', description: 'Access to system statistics and reports' },
    { icon: Settings, title: 'System Settings', description: 'Configure application settings and preferences' },
    { icon: Crown, title: 'Role Management', description: 'Assign and modify user roles and permissions' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Create SuperAdmin
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Set up the first SuperAdmin account with full system access and control over all features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SuperAdmin Creation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">SuperAdmin Account</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 py-3 rounded-l-lg border border-r-0 border-white/30 bg-white/20 text-purple-200 font-semibold">
                    +252
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-r-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Enter phone number"
                    maxLength={9}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Password (5+ chars, numbers or letters)"
                  minLength={5}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Confirm password"
                  minLength={5}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Admin Token
                </label>
                <input
                  type="password"
                  value={formData.adminToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminToken: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Enter the admin token"
                  required
                />
                <p className="text-xs text-purple-300 mt-1">
                  Required for security. Set ADMIN_TOKEN in your .env.local file.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all duration-300"
              >
                {isLoading ? 'Creating SuperAdmin...' : '👑 Create SuperAdmin'}
              </button>
            </form>

            {result && (
              <div className="mt-6 p-4 rounded-lg bg-white/10 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Result:</h3>
                <pre className="text-sm text-purple-200 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </motion.div>

          {/* SuperAdmin Permissions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">SuperAdmin Powers</h2>
              <div className="space-y-4">
                {superAdminPermissions.map((permission, index) => (
                  <motion.div
                    key={permission.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-start space-x-4 p-4 bg-white/10 rounded-lg border border-white/20"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <permission.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {permission.title}
                      </h3>
                      <p className="text-purple-200 text-sm">
                        {permission.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
              <h3 className="text-xl font-bold text-yellow-300 mb-3">⚠️ Important Notes</h3>
              <ul className="text-yellow-200 space-y-2 text-sm">
                <li>• Only create ONE SuperAdmin account</li>
                <li>• Admin token required for security</li>
                <li>• SuperAdmin has full system access</li>
                <li>• Can manage all users and properties</li>
                <li>• Can assign roles to other users</li>
                <li>• Keep your login credentials secure</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
