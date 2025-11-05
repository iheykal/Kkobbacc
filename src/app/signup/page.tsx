'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Lock, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUser } from '@/contexts/UserContext'

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useUser()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password using new rules (5+ chars, numbers or letters)
    if (formData.password.length < 5) {
      alert('Password must be at least 5 characters long')
      return
    }
    
    const hasNumber = /\d/.test(formData.password)
    const hasAlphabet = /[a-zA-Z]/.test(formData.password)
    
    if (!hasNumber && !hasAlphabet) {
      alert('Password must contain at least one number or one alphabet')
      return
    }
    
    // Allow numbers only, text only, or mixed passwords
    
    // Validate phone number format (should have 9 digits)
    if (!/^\d{9}$/.test(formData.phone)) {
      alert('Please enter a valid phone number (9 digits, e.g., 61xxxxxxx)')
      return
    }
    
    setIsLoading(true)
    
    try {
      const signupData = {
        firstName: formData.fullName.split(' ')[0] || formData.fullName,
        lastName: formData.fullName.split(' ')[1] || '',
        phone: formData.phone,
        password: formData.password,
        role: 'user',
        location: '',
        avatar: ''
      }
      
      const success = await signup(signupData)
      
      if (success) {
        router.push('/')
      }
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Kobac Real Estate</h2>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                  <img src="/icons/somali-flag.jpg" alt="Somalia Flag" className="w-5 h-4 object-contain" />
                  <span className="text-gray-500 font-medium text-sm">+252</span>
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter phone number (9 digits)"
                  value={formData.phone}
                  onChange={(e) => {
                    const numbersOnly = e.target.value.replace(/\D/g, '')
                    handleInputChange('phone', numbersOnly)
                  }}
                  required
                  maxLength={9}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-20 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter password (5+ chars, numbers or letters)"
                value={formData.password}
                onChange={(e) => {
                  handleInputChange('password', e.target.value)
                }}
                required
                minLength={5}
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 5 characters with numbers or letters</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-100">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}


