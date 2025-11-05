'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  Plus,
  Building2,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  FileText
} from 'lucide-react'

interface AgentNavigationProps {
  user: {
    id: string
    fullName: string
    avatar?: string
    role: string
  }
  onLogout: () => void
}

export const AgentNavigation: React.FC<AgentNavigationProps> = ({ user, onLogout }) => {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/agent',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview of your properties and performance'
    },
    {
      href: '/agent/properties',
      label: 'My Properties',
      icon: Building2,
      description: 'Manage your property listings'
    },
    {
      href: '/agent/add-property',
      label: 'Add Property',
      icon: Plus,
      description: 'Create a new property listing'
    },
    {
      href: '/agent/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'View performance metrics'
    },
    {
      href: '/agent/clients',
      label: 'Clients',
      icon: Users,
      description: 'Manage your client relationships'
    }
  ]

  const profileItems = [
    {
      href: '/agent/profile',
      label: 'Profile',
      icon: FileText,
      description: 'Manage your agent profile'
    },
    {
      href: '/agent/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account and preferences'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/agent') {
      return pathname === '/agent'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-white font-semibold text-lg">KOBAC Agent</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg transition-all duration-200 group ${
                    active 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200">
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-white font-medium hidden sm:block">{user.fullName}</span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-slate-400 text-sm capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  {profileItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          active 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                  
                  <div className="border-t border-slate-700 mt-2 pt-2">
                    <button
                      onClick={onLogout}
                      className="flex items-center space-x-3 px-3 py-2 w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}


