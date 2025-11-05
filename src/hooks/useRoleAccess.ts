'use client'

import { useUser } from '@/contexts/UserContext'
import { Role } from '@/lib/authz/policy'

/**
 * Hook for role-based access control in components
 * Provides utilities to check permissions and access levels
 */
export function useRoleAccess() {
  const { user } = useUser()

  const role = user?.role as Role || 'user'

  /**
   * Check if user has a specific role
   */
  const hasRole = (requiredRole: Role | Role[]): boolean => {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role)
    }
    return role === requiredRole
  }

  /**
   * Check if user is admin (superadmin)
   */
  const isAdmin = (): boolean => {
    return hasRole('superadmin')
  }

  /**
   * Check if user is agent or admin
   */
  const isAgentOrAdmin = (): boolean => {
    return hasRole(['agent', 'superadmin'])
  }

  /**
   * Check if user can access a specific route
   */
  const canAccessRoute = (route: string): boolean => {
    // Define route access rules
    const routeRules: Record<string, Role[]> = {
      '/admin': ['superadmin'],
      '/agent': ['agent', 'superadmin'],
      '/dashboard': ['user', 'agent', 'superadmin'],
      '/profile': ['user', 'agent', 'superadmin']
    }
    
    // Check if the route has specific rules
    for (const [routePattern, allowedRoles] of Object.entries(routeRules)) {
      if (route.startsWith(routePattern)) {
        return allowedRoles.includes(role)
      }
    }
    
    // Default: allow access to all routes (public routes)
    return true
  }

  /**
   * Get the default route for the user's role
   */
  const getDefaultRoute = (): string => {
    switch (role) {
      case 'superadmin':
        return '/admin'
      case 'agent':
        return '/agent'
      case 'user':
      default:
        return '/dashboard'
    }
  }

  /**
   * Check if user can perform an action on a resource
   * This is a simplified version for frontend use
   * Full authorization should be done on the server
   */
  const canPerformAction = (action: string, resource: string): boolean => {
    // Basic frontend checks - server should always validate
    switch (role) {
      case 'superadmin':
        return true // Superadmin can do everything
      
      case 'agent':
        // Agents can manage properties and their own profile
        if (resource === 'property' && ['create', 'read', 'update', 'delete'].includes(action)) {
          return true
        }
        if (resource === 'profile' && ['read', 'update'].includes(action)) {
          return true
        }
        return false
      
      case 'user':
      default:
        // Users can only read properties and manage their own profile
        if (resource === 'property' && action === 'read') {
          return true
        }
        if (resource === 'profile' && ['read', 'update'].includes(action)) {
          return true
        }
        return false
    }
  }

  /**
   * Check if user can see a specific UI element
   */
  const canSee = (element: string): boolean => {
    switch (element) {
      case 'admin-panel':
        return isAdmin()
      
      case 'agent-dashboard':
        return isAgentOrAdmin()
      
      case 'property-creation':
        return isAgentOrAdmin()
      
      case 'user-management':
        return isAdmin()
      
      case 'analytics':
        return isAgentOrAdmin()
      
      default:
        return true
    }
  }

  return {
    role,
    hasRole,
    isAdmin,
    isAgentOrAdmin,
    canAccessRoute,
    getDefaultRoute,
    canPerformAction,
    canSee
  }
}


