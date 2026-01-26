'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, formatPhoneNumber, DEFAULT_AVATAR_URL } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/contexts/UserContext'
import HybridImage from '@/components/ui/HybridImage'
import {
  Menu,
  X,
  User,
  Heart,
  Phone,
  MapPin,
  LogOut,
  Home,
  Shield,
  Crown
} from 'lucide-react'

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const { user, isAuthenticated, logout } = useUser()
  const router = useRouter()

  const navigation = [
    { name: 'Properties', href: '/properties' },
    { name: 'Agents', href: '/agents' },
    { name: 'About', href: '/about' },
  ]

  return (
    <header className="relative bg-white/95 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-4 hover:opacity-80 transition-opacity duration-200 cursor-pointer focus:outline-none rounded-lg p-2 -m-2"
              title="Click to go to homepage"
            >
              <div className="w-24 h-24 flex items-center justify-center">
                <HybridImage
                  src="/icons/newlogo.png"
                  alt="Kobac Logo"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="hidden sm:block">
                <motion.h1
                  className="text-2xl font-serif font-bold text-blue-600"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                >
                  Kobac Property
                </motion.h1>
                <motion.p
                  className="text-xs text-primary-600 -mt-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Helping you make the right property choice
                </motion.p>
              </div>
            </button>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-primary-700 hover:text-white transition-colors duration-200 font-medium"
                whileHover={{ y: -2 }}
              >
                {item.name}
              </motion.a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">

            {/* Phone Number */}
            <div className="hidden md:flex items-center space-x-2 text-primary-700">
              <Phone className="w-4 h-4 text-white" />
              <span className="font-medium text-lg">0610251014</span>
            </div>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 hover:bg-primary-50 transition-colors duration-200"
              >
                {isAuthenticated && user?.avatar ? (
                  <HybridImage
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary-100"
                  />
                ) : null}
                {isAuthenticated && (!user?.avatar || user.avatar === DEFAULT_AVATAR_URL) ? (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 font-semibold text-sm border-2 border-gray-200">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.lastName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                ) : null}
                {!isAuthenticated && (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden sm:block">
                  {isAuthenticated ? `${user?.firstName}` : 'Account'}
                </span>
              </Button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-luxury border border-primary-100 py-2"
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 border-b border-primary-100">
                          <div className="flex items-center space-x-3">
                            {user?.avatar && user.avatar !== DEFAULT_AVATAR_URL ? (
                              <HybridImage
                                src={user.avatar}
                                alt={`${user.firstName} ${user.lastName}`}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover border-2 border-primary-100"
                              />
                            ) : null}
                            {(!user?.avatar || user.avatar === DEFAULT_AVATAR_URL) ? (
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-700 font-semibold text-sm border-2 border-gray-200">
                                {user?.firstName?.charAt(0)?.toUpperCase() || user?.lastName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            ) : null}
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium text-primary-900">
                                  {user?.firstName} {user?.lastName}
                                </p>
                                {user?.role === 'super_admin' && (
                                  <div className="flex items-center space-x-1">
                                    <div className="relative">
                                      <Shield className="w-5 h-5 text-gray-600 drop-shadow-sm" />
                                      <Crown className="w-3 h-3 text-gray-500 absolute -top-1 -right-1" />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-lg border border-gray-200">
                                      ULTIMATE SUPERADMIN
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-primary-600">{user?.phone ? formatPhoneNumber(user.phone) : ''}</p>
                              {user?.role && (
                                <p className="text-xs text-primary-500 capitalize">{user.role}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {(user?.role === 'agent' || user?.role === 'agency') && (
                          <Link
                            href="/agent"
                            className="block px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 flex items-center space-x-2"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Home className="w-4 h-4" />
                            <span>Agent Dashboard</span>
                          </Link>
                        )}
                        <a
                          href="/profile"
                          className="block px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          Profile Settings
                        </a>
                        <a
                          href="/saved"
                          className="block px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 flex items-center space-x-2"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Saved Properties</span>
                        </a>
                        <hr className="my-2 border-primary-100" />
                        <button
                          onClick={() => {
                            logout()
                            setIsUserMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setAuthMode('login')
                            setIsAuthModalOpen(true)
                            setIsUserMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                        >
                          <User className="w-4 h-4" />
                          <span>Sign In</span>
                        </button>
                        <button
                          onClick={() => {
                            setAuthMode('signup')
                            setIsAuthModalOpen(true)
                            setIsUserMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 hover:text-white transition-colors duration-200 flex items-center space-x-2"
                        >
                          <User className="w-4 h-4" />
                          <span>Create Account</span>
                        </button>
                        <hr className="my-2 border-primary-100" />
                        <a
                          href="/saved"
                          className="block px-4 py-2 text-sm text-primary-700 hover:bg-primary-50 flex items-center space-x-2"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Saved Properties</span>
                        </a>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Authentication Modal - Positioned relative to user menu */}
              <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
              />
            </div>

            {/* CTA Button */}
            {isAuthenticated && (user?.role === 'superadmin') && (
              <a href="/admin/users" className="hidden sm:flex px-4 py-2 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50">
                Admin
              </a>
            )}

            {isAuthenticated && (user?.role === 'agent' || user?.role === 'agency') && (
              <Link href="/agent" className="hidden sm:flex px-4 py-2 rounded-md border border-primary-200 text-primary-700 hover:bg-primary-50">
                Agent Dashboard
              </Link>
            )}

            <Button
              variant="gold"
              size="sm"
              className="hidden sm:flex"
              onClick={() => {
                if (isAuthenticated && (user?.role === 'agent' || user?.role === 'agency')) {
                  // Agent users go to dashboard
                  router.push('/agent')
                } else if (isAuthenticated) {
                  // Non-agent users see upgrade prompt
                  alert('To list properties, you need to be upgraded to agent status. Please contact support.')
                } else {
                  // Non-authenticated users see signup modal
                  setAuthMode('signup')
                  setIsAuthModalOpen(true)
                }
              }}
            >
              List Your Property
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-primary-100 bg-white"
          >
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-lg text-primary-700 hover:text-white transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <hr className="border-primary-100" />
              <div className="space-y-4">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-primary-100">
                      <p className="text-sm font-medium text-primary-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-primary-600">{user?.phone ? formatPhoneNumber(user.phone) : ''}</p>
                    </div>
                    {(user?.role === 'agent' || user?.role === 'agency') && (
                      <Link href="/agent">
                        <Button variant="outline" fullWidth className="flex items-center justify-center space-x-2">
                          <Home className="w-4 h-4" />
                          <span>Agent Dashboard</span>
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" fullWidth>
                      Profile Settings
                    </Button>
                    <Button variant="outline" fullWidth>
                      Saved Properties
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => {
                        logout()
                        setIsMenuOpen(false)
                      }}
                    >
                      Sign Out
                    </Button>

                    {/* Mobile List Your Property Button */}
                    {(user?.role === 'agent' || user?.role === 'agency') && (
                      <Button
                        variant="gold"
                        fullWidth
                        onClick={() => {
                          router.push('/agent')
                          setIsMenuOpen(false)
                        }}
                      >
                        List Your Property
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setAuthMode('login')
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In</span>
                    </Button>
                    <Button
                      variant="gold"
                      fullWidth
                      onClick={() => {
                        setAuthMode('signup')
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      Create Account
                    </Button>

                    {/* Mobile List Your Property Button for non-authenticated users */}
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setAuthMode('signup')
                        setIsAuthModalOpen(true)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <span>List Your Property</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  )
}
