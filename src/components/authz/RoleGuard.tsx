'use client'

import React from 'react'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { Role } from '@/lib/authz/policy'

interface RoleGuardProps {
  allowedRoles: Role | Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * RoleGuard component that conditionally renders children based on user role
 * 
 * @param allowedRoles - Single role or array of roles that can access the content
 * @param children - Content to render if user has permission
 * @param fallback - Content to render if user doesn't have permission (optional)
 * @param redirectTo - Route to redirect to if user doesn't have permission (optional)
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback = null,
  redirectTo 
}) => {
  const { hasRole } = useRoleAccess()

  // Check if user has the required role
  const hasPermission = hasRole(allowedRoles)

  // If user doesn't have permission and redirect is specified
  if (!hasPermission && redirectTo) {
    // In a real app, you might want to use Next.js router here
    // For now, we'll just render the fallback
    return <>{fallback}</>
  }

  // If user doesn't have permission, render fallback or nothing
  if (!hasPermission) {
    return <>{fallback}</>
  }

  // User has permission, render children
  return <>{children}</>
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role | Role[],
  fallback?: React.ReactNode
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}

/**
 * Hook for conditional rendering based on role
 */
export function useRoleGuard(allowedRoles: Role | Role[]) {
  const { hasRole } = useRoleAccess()
  return hasRole(allowedRoles)
}


