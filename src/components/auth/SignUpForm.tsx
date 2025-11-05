'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Phone, Sparkles, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useUser } from '@/contexts/UserContext'

interface SignUpFormProps {
  onSwitchToLogin: () => void
  onClose: () => void
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signup } = useUser()

  // Password strength calculation - updated for new rules
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 5) score++ // Changed from 12 to 5
    if (/[a-zA-Z]/.test(password)) score++ // Has letters
    if (/[0-9]/.test(password)) score++ // Has numbers
    if (password.length >= 8) score++ // Bonus for longer passwords
    if (/[^A-Za-z0-9]/.test(password)) score++ // Special characters
    
    if (score <= 1) return { score, label: 'Weak', color: 'text-red-400' }
    if (score === 2) return { score, label: 'Fair', color: 'text-yellow-400' }
    if (score === 3) return { score, label: 'Good', color: 'text-blue-400' }
    return { score, label: 'Strong', color: 'text-green-400' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📝 Form submission started with data:', { ...formData, password: '***' });
    
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
    
    console.log('✅ Form validation passed, calling signup function...');
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
      };
      
      console.log('🚀 Calling signup with data:', { ...signupData, password: '***' });
      
      const success = await signup(signupData)
      
      console.log('📡 Signup result:', success);
      
      if (success) {
        console.log('✅ Signup successful, closing modal');
        onClose()
      } else {
        console.log('❌ Signup failed');
      }
    } catch (error) {
      console.error('💥 Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 50, 
      scale: 0.8,
      rotateX: -15,
      filter: 'blur(10px)'
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: -50, 
      scale: 0.8,
      rotateX: 15,
      filter: 'blur(10px)',
      transition: { duration: 0.4 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  const buttonVariants = {
    idle: { 
      scale: 1,
      boxShadow: "0 0 0 0 rgba(236, 72, 153, 0.7)"
    },
    hover: { 
      scale: 1.02,
      boxShadow: "0 0 0 20px rgba(236, 72, 153, 0)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    tap: { scale: 0.98 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full min-h-[580px] bg-gradient-to-br from-slate-900 via-pink-900 to-slate-900 rounded-3xl shadow-2xl border border-pink-500/20 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #be185d 50%, #0f172a 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(236, 72, 153, 0.1)'
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-pink-500/30 to-rose-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        />
          </div>

      <Card className="w-full shadow-none border-0 bg-transparent">
        <CardContent className="p-6 relative">
          {/* Header */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-6"
          >
            <motion.div 
              className="relative w-20 h-20 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
              whileHover={{ 
                scale: 1.1,
                rotate: -5,
                boxShadow: "0 20px 40px rgba(236, 72, 153, 0.4)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-black text-white mb-3 bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent"
            >
              CREATE ACCOUNT
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-pink-200/80 font-medium"
            >
              Join our luxury real estate community
            </motion.p>
          </motion.div>

                     {/* Form */}
          <motion.form 
            variants={itemVariants}
            onSubmit={handleSubmit} 
            className="space-y-6 mb-6"
          >
            {/* Full Name */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
               <Input
                 type="text"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                 required
                icon={<User className="w-5 h-5 text-pink-400 flex-shrink-0" />}
                className="h-14 w-full max-w-[500px] mx-auto bg-slate-800/80 border-pink-500/30 text-white placeholder-pink-200/60 rounded-xl focus:border-pink-400 focus:ring-pink-400/20 transition-all duration-300 pl-14"
              />
            </motion.div>

                          {/* Phone */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                  <img src="/icons/somali-flag.jpg" alt="Somalia Flag" className="w-6 h-4 object-contain" />
                  <span className="text-purple-400 font-semibold">+252</span>
                </div>
             <Input
               type="tel"
                  inputMode="numeric"
                  placeholder="Enter phone number (9 digits)"
               value={formData.phone}
                  onChange={(e) => {
                    // Only allow numbers for the local part
                    const numbersOnly = e.target.value.replace(/\D/g, '');
                    // Store just the local number (without country code)
                    handleInputChange('phone', numbersOnly);
                  }}
               required
                  className="h-14 w-full max-w-[500px] mx-auto bg-slate-800/80 border-pink-500/30 text-white placeholder-pink-200/60 rounded-xl focus:border-pink-400 focus:ring-pink-400/20 transition-all duration-300 pl-24"
                  maxLength={9}
             />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <div className="relative w-full max-w-[500px] mx-auto">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password (5+ chars, numbers or letters)"
                value={formData.password}
                onChange={(e) => {
                  handleInputChange('password', e.target.value)
                }}
                inputMode="text"
                required
                icon={<Lock className="w-5 h-5 text-pink-400 flex-shrink-0" />}
                className="h-14 w-full bg-slate-800/80 border-pink-500/30 text-white placeholder-pink-200/60 rounded-xl focus:border-pink-400 focus:ring-pink-400/20 transition-all duration-300 pl-14 pr-14"
                minLength={5}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-400 hover:text-pink-300 transition-colors"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="w-full max-w-[500px] mx-auto mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-pink-200/80">Password Strength:</span>
                  <span className={passwordStrength.color}>{passwordStrength.label}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-red-400' :
                      passwordStrength.score === 3 ? 'bg-yellow-400' :
                      passwordStrength.score === 4 ? 'bg-blue-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-pink-200/60 mt-1">
                  {formData.password.length < 5 && 'At least 5 characters required'}
                  {formData.password.length >= 5 && passwordStrength.score < 2 && 'Add numbers or letters for better security'}
                </div>
              </div>
            )}
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <motion.div
                variants={buttonVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="relative overflow-hidden rounded-xl"
              >
            <Button
              type="submit"
              variant="primary"
              fullWidth
                  className="h-14 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:via-rose-700 hover:to-purple-700 text-white font-bold text-lg rounded-xl relative overflow-hidden transition-all duration-300"
              disabled={isLoading}
            >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        Creating Account...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Create Account
                      </motion.div>
                    )}
                  </AnimatePresence>
            </Button>
                
                {/* Button Glow Effect */}
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-pink-400/20 via-rose-400/20 to-purple-400/20 rounded-xl blur-xl"
                  animate={{
                    opacity: isHovered ? 1 : 0.3,
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          </motion.form>

          {/* Switch to Login */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-6"
          >
            <p className="text-pink-200/80">
              Already have an account?{' '}
              <motion.button
                onClick={onSwitchToLogin}
                className="text-pink-300 hover:text-pink-200 font-bold hover:underline transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </p>
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/50 text-pink-300 hover:text-pink-200 hover:bg-slate-700/50 transition-all duration-300 backdrop-blur-sm border border-pink-500/20"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
