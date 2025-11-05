'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Phone, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useUser } from '@/contexts/UserContext'

interface LoginFormProps {
  onSwitchToSignUp: () => void
  onClose: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp, onClose }) => {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { login } = useUser()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation - let the backend handle detailed validation
    if (!formData.password || formData.password.length < 1) {
      alert('Password is required (numbers only)')
      return
    }
    
    // Phone number validation (9 digits only)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 9) {
      alert('Please enter a valid phone number (9 digits, e.g., 61xxxxxxx)')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Let the backend handle phone number normalization
      const success = await login(formData.phone, formData.password)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Login failed:', error)
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
      boxShadow: "0 0 0 0 rgba(99, 102, 241, 0.7)"
    },
    hover: { 
      scale: 1.02,
      boxShadow: "0 0 0 20px rgba(99, 102, 241, 0)",
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
      className="w-full min-h-[520px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl border border-purple-500/20 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(168, 85, 247, 0.1)'
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
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
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
              className="relative w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl"
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
                boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <ArrowRight className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <motion.h2 
              variants={itemVariants}
              className="text-3xl font-black text-white mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent"
            >
              WELCOME BACK
            </motion.h2>
            
            <motion.p 
              variants={itemVariants}
              className="text-purple-200/80 font-medium"
            >
              Sign in to your luxury account
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form 
            variants={itemVariants}
            onSubmit={handleSubmit} 
            className="space-y-6 mb-6"
          >
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
                    // Allow flexible phone number input
                    const input = e.target.value;
                    // Allow digits, +, and spaces for flexibility
                    const cleaned = input.replace(/[^\d+\s]/g, '');
                    handleInputChange('phone', cleaned);
                  }}
              required
                  className="h-14 w-full max-w-[500px] mx-auto bg-slate-800/80 border-purple-500/30 text-white placeholder-purple-200/60 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 pl-24"
            />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
            <Input
                type={showPassword ? "text" : "password"}
              placeholder="Password (5+ chars, numbers or letters)"
              value={formData.password}
              onChange={(e) => {
                handleInputChange('password', e.target.value)
              }}
              inputMode="text"
              required
                icon={<Lock className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                className="h-14 w-full max-w-[500px] mx-auto bg-slate-800/80 border-purple-500/30 text-white placeholder-purple-200/60 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300 pl-14 pr-12"
            />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 transition-colors z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </motion.div>

            {/* Forgot Password */}
            <motion.div 
              variants={itemVariants}
              className="text-right"
            >
              <motion.button
                type="button"
                className="text-sm text-purple-300 hover:text-purple-200 font-semibold transition-colors"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Forgot Password?
              </motion.button>
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
                  className="h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold text-lg rounded-xl relative overflow-hidden transition-all duration-300"
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
                        Signing In...
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="w-5 h-5" />
                        Sign In
                      </motion.div>
                    )}
                  </AnimatePresence>
            </Button>
                
                {/* Button Glow Effect */}
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-red-400/20 rounded-xl blur-xl"
                  animate={{
                    opacity: isHovered ? 1 : 0.3,
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          </motion.form>

          {/* Switch to Sign Up */}
          <motion.div 
            variants={itemVariants}
            className="text-center mt-6"
          >
            <p className="text-purple-200/80">
              Don't have an account?{' '}
              <motion.button
                onClick={onSwitchToSignUp}
                className="text-purple-300 hover:text-purple-200 font-bold hover:underline transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Account
              </motion.button>
            </p>
          </motion.div>

          {/* Close Button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 p-3 rounded-full bg-slate-800/50 text-purple-300 hover:text-purple-200 hover:bg-slate-700/50 transition-all duration-300 backdrop-blur-sm border border-purple-500/20"
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
