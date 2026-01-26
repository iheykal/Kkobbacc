'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEFAULT_AVATAR_URL } from '@/lib/utils'

// Helper function to get redirect path based on user role
const getRedirectPath = (role: string): string | null => {
  switch (role) {
    case 'superadmin':
      return '/admin'
    case 'agent':
    case 'agency':
      return '/agent'
    case 'user':
    case 'normal_user':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  phone: string
  role: string
  location: string
  avatar: string
  preferences: {
    favoriteProperties: string[]
    searchHistory: string[]
    notifications: boolean
  }
}

interface UserContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, password: string) => Promise<boolean>
  signup: (userData: Omit<User, 'id' | 'preferences'> & { password: string }) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  validateSession: () => Promise<boolean>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true to prevent premature redirects
  const [hasLoggedOut, setHasLoggedOut] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false) // Flag to prevent auth check after login

  // Check for existing user session on mount (non-blocking)
  useEffect(() => {
    if (hasInitialized) {
      console.log('🔍 UserContext: Already initialized, skipping...')
      return
    }

    // If user is already logged in or just logged in, don't run auth check
    if (user || justLoggedIn) {
      console.log('🔍 UserContext: User already logged in or just logged in, skipping auth check')
      setHasInitialized(true)
      return
    }

    const checkAuth = async () => {
      try {
        setHasInitialized(true)

        // Check if there's a logout flag cookie first
        const logoutFlag = document.cookie.includes('kobac_logout=true')
        if (logoutFlag) {
          setHasLoggedOut(true)
          return
        }

        // If user has explicitly logged out, don't auto-restore
        if (hasLoggedOut) {
          return
        }

        // Set loading only when we're actually checking auth
        setIsLoading(true)

        const controller = new AbortController()
        // Increase timeout to prevent login abort issues
        const timeoutDuration = process.env.NODE_ENV === 'production' ? 8000 : 5000;
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, timeoutDuration)

        const meRes = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add retry logic for production
          ...(process.env.NODE_ENV === 'production' && {
            mode: 'cors',
            cache: 'no-store'
          })
        })

        clearTimeout(timeoutId)

        if (meRes.ok) {
          const me = await meRes.json()

          if (me?.success && me?.data) {
            const meUser = me.data

            const userData: User = {
              id: meUser.id,
              firstName: meUser.fullName?.split(' ')[0] || meUser.fullName,
              lastName: meUser.fullName?.split(' ')[1] || '',
              phone: meUser.phone,
              role: meUser.role,
              location: 'Not specified',
              avatar: meUser.avatar || DEFAULT_AVATAR_URL,
              preferences: { favoriteProperties: [], searchHistory: [], notifications: true }
            }
            setUser(userData)
            localStorage.setItem('luxury-estates-user', JSON.stringify(userData))
            setHasLoggedOut(false) // Reset logout flag on successful auth
          }
        } else {
          // Only fall back to localStorage if we haven't explicitly logged out
          if (!hasLoggedOut) {
            const savedUser = localStorage.getItem('luxury-estates-user')
            if (savedUser) {
              try {
                const userData = JSON.parse(savedUser)
                setUser(userData)
                // Don't set hasLoggedOut to false here, let the user stay logged in locally
              } catch (parseError) {
                console.error('Error parsing saved user data:', parseError)
                localStorage.removeItem('luxury-estates-user')
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('UserContext: Error checking authentication:', error)
        }

        // On error, try to use localStorage as fallback
        if (!hasLoggedOut) {
          const savedUser = localStorage.getItem('luxury-estates-user')
          if (savedUser) {
            try {
              const userData = JSON.parse(savedUser)
              setUser(userData)
            } catch (parseError) {
              localStorage.removeItem('luxury-estates-user')
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [hasInitialized]) // Remove hasLoggedOut from dependencies to prevent re-running after login

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log('🔑 UserContext: Starting login process for phone:', phone)

      const requestBody = { phone, password };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      console.log('🔑 UserContext: Login response status:', response.status)

      const result = await response.json()
      console.log('🔑 UserContext: Login result:', result)

      if (result.success) {
        const userData: User = {
          id: result.data.id,
          firstName: result.data.fullName.split(' ')[0] || result.data.fullName,
          lastName: result.data.fullName.split(' ')[1] || '',
          phone: result.data.phone,
          role: result.data.role,
          location: 'Not specified',
          avatar: result.data.avatar || DEFAULT_AVATAR_URL,
          preferences: {
            favoriteProperties: [],
            searchHistory: [],
            notifications: true
          }
        }

        console.log('🔑 UserContext: Setting user data after successful login:', userData)
        setUser(userData)
        localStorage.setItem('luxury-estates-user', JSON.stringify(userData))
        setHasLoggedOut(false) // Reset logout flag on successful login
        setJustLoggedIn(true) // Set flag to prevent auth check from running

        // Clear logout flag cookie
        document.cookie = 'kobac_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        console.log('✅ Login completed successfully, logout flag cleared')

        // Redirect based on user role
        const redirectPath = getRedirectPath(userData.role)
        if (redirectPath && typeof window !== 'undefined') {
          console.log('🔑 UserContext: Redirecting to:', redirectPath)
          window.location.href = redirectPath
        }

        return true
      } else {
        console.error('❌ UserContext: Login failed:', result.error)
        alert(result.error || 'Login failed')
        return false
      }
    } catch (error) {
      console.error('❌ UserContext: Login error:', error)
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Login request timed out. Please check your connection and try again.')
      } else {
        alert('Login failed. Please try again.')
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (userData: Omit<User, 'id' | 'preferences'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true)

      const requestBody = {
        fullName: userData.firstName + ' ' + userData.lastName,
        phone: '+252' + userData.phone,
        password: userData.password
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (result.success) {
        const newUser: User = {
          ...userData,
          id: result.data.id,
          phone: result.data.phone,
          role: result.data.role,
          avatar: result.data.avatar,
          preferences: {
            favoriteProperties: [],
            searchHistory: [],
            notifications: true
          }
        }

        setUser(newUser)
        localStorage.setItem('luxury-estates-user', JSON.stringify(newUser))
        setHasLoggedOut(false) // Reset logout flag on successful signup

        // Clear logout flag cookie
        document.cookie = 'kobac_logout=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        return true
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error :
          result.error?.message ||
          result.details ||
          'Signup failed';
        console.error('Signup failed:', result);
        alert(errorMessage);
        return false
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Clear local state first to prevent race conditions
      setUser(null)
      localStorage.removeItem('luxury-estates-user')
      setHasLoggedOut(true) // Set logout flag
      setJustLoggedIn(false) // Reset login flag

      // Set logout flag cookie to prevent auto-login
      document.cookie = 'kobac_logout=true; path=/; max-age=86400' // 24 hours

      // Then clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include credentials to ensure cookie is cleared
      })

      console.log('✅ Logout completed successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if server logout fails, ensure local state is cleared
      setUser(null)
      localStorage.removeItem('luxury-estates-user')
      setHasLoggedOut(true)
      // Still set logout flag cookie
      document.cookie = 'kobac_logout=true; path=/; max-age=86400'
    }
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('luxury-estates-user', JSON.stringify(updatedUser))
    }
  }

  const validateSession = async (): Promise<boolean> => {
    try {
      const meRes = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (meRes.ok) {
        const me = await meRes.json()
        if (me?.success && me?.data) {
          const meUser = me.data
          const userData: User = {
            id: meUser.id,
            firstName: meUser.fullName?.split(' ')[0] || meUser.fullName,
            lastName: meUser.fullName?.split(' ')[1] || '',
            phone: meUser.phone,
            role: meUser.role,
            location: 'Not specified',
            avatar: meUser.avatar || DEFAULT_AVATAR_URL,
            preferences: { favoriteProperties: [], searchHistory: [], notifications: true }
          }
          setUser(userData)
          localStorage.setItem('luxury-estates-user', JSON.stringify(userData))
          setHasLoggedOut(false)
          return true
        }
      }

      // Session is invalid
      setUser(null)
      localStorage.removeItem('luxury-estates-user')
      setHasLoggedOut(true)
      return false
    } catch (error) {
      console.error('Error validating session:', error)
      return false
    }
  }

  const value: UserContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    validateSession
  }

  console.log('🔍 UserContext value:', { user: !!user, isLoading, isAuthenticated: !!user })

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
