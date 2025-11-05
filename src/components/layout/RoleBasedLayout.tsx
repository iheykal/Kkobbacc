'use client'

import React from 'react'
import { RoleBasedNavigation } from '../navigation/RoleBasedNavigation'

interface RoleBasedLayoutProps {
  user: {
    id: string
    fullName: string
    avatar?: string
    role: string
  }
  onLogout: () => void
  children: React.ReactNode
}

export const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ 
  user, 
  onLogout, 
  children 
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Role-based Navigation */}
      <RoleBasedNavigation user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}


