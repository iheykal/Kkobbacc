'use client'

import React from 'react'
import { UserNavigation } from './UserNavigation'
import { AgentNavigation } from './AgentNavigation'
import { AdminNavigation } from './AdminNavigation'

interface RoleBasedNavigationProps {
  user: {
    id: string
    fullName: string
    avatar?: string
    role: string
  }
  onLogout: () => void
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({ user, onLogout }) => {
  // Render the appropriate navigation based on user role
  switch (user.role) {
    case 'superadmin':
      return <AdminNavigation user={user} onLogout={onLogout} />
    
    case 'agent':
      return <AgentNavigation user={user} onLogout={onLogout} />
    
    case 'user':
    default:
      return <UserNavigation user={user} onLogout={onLogout} />
  }
}


