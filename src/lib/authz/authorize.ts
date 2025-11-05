import { Role, Action, Resource, Permission, getPermission } from './policy';

/**
 * Authorization Context
 * Contains all information needed to make authorization decisions
 */
export interface AuthContext {
  sessionUserId: string;    // ID of the user making the request
  role: Role;              // Role of the user making the request
  action: Action;          // Action being performed
  resource: Resource;      // Resource being accessed
  ownerId?: string;        // ID of the resource owner (if applicable)
  resourceId?: string;     // ID of the specific resource (for logging)
}

/**
 * Authorization Result
 * Contains the decision and additional context
 */
export interface AuthResult {
  allowed: boolean;        // Whether the action is allowed
  reason?: string;         // Reason for denial (for logging)
  scope?: 'any' | 'own';  // Scope of access if allowed
}

/**
 * Check if a role can perform an action on a resource
 * Returns both 'any' and 'own' permissions
 */
export function can(role: Role, action: Action, resource: Resource): Permission {
  return getPermission(role, action, resource);
}

/**
 * Main authorization function
 * Determines if a user can perform an action on a resource
 */
export function isAllowed(context: AuthContext): AuthResult {
  const { sessionUserId, role, action, resource, ownerId } = context;
  
  // Normalize role to handle legacy values
  const normalizedRole = normalizeRole(role);
  
  // Get permissions for this role/action/resource combination
  const permission = getPermission(normalizedRole, action, resource);
  
  // If no permissions at all, deny
  if (!permission.any && !permission.own) {
    return {
      allowed: false,
      reason: `Role '${normalizedRole}' has no permissions for '${action}' on '${resource}'`
    };
  }
  
  // If user can perform action on any resource, allow
  if (permission.any) {
    return {
      allowed: true,
      scope: 'any'
    };
  }
  
  // If user can only perform action on own resources
  if (permission.own) {
    // If no ownerId provided, we can't determine ownership
    if (!ownerId) {
      return {
        allowed: false,
        reason: `Ownership check required but no ownerId provided for '${action}' on '${resource}'`
      };
    }
    
    // Check if the user owns the resource
    if (sessionUserId === ownerId) {
      return {
        allowed: true,
        scope: 'own'
      };
    } else {
      return {
        allowed: false,
        reason: `User '${sessionUserId}' does not own resource owned by '${ownerId}'`
      };
    }
  }
  
  // This should never happen, but just in case
  return {
    allowed: false,
    reason: 'Unknown authorization error'
  };
}

/**
 * Check if a user can access a specific resource by ID
 * This is a convenience function that loads the resource and checks ownership
 */
export async function canAccessResource<T extends { _id: string; userId?: string; agentId?: string; ownerId?: string }>(
  context: Omit<AuthContext, 'ownerId'>,
  resourceLoader: (id: string) => Promise<T | null>
): Promise<AuthResult & { resource?: T }> {
  const { resourceId, role, action, resource } = context;
  
  if (!resourceId) {
    return {
      allowed: false,
      reason: 'No resource ID provided'
    };
  }
  
  // Check if user has 'any' permission first (for superadmin and other admin roles)
  const permission = getPermission(role, action, resource);
  if (permission.any) {
    // User can access any resource, so load it and return
    const resourceData = await resourceLoader(resourceId);
    if (!resourceData) {
      return {
        allowed: false,
        reason: 'Resource not found'
      };
    }
    return {
      allowed: true,
      scope: 'any',
      resource: resourceData
    };
  }
  
  // Load the resource for ownership check
  const resourceData = await resourceLoader(resourceId);
  
  if (!resourceData) {
    return {
      allowed: false,
      reason: 'Resource not found'
    };
  }
  
  // Determine the owner ID from the resource
  const ownerId = resourceData.userId || resourceData.agentId || resourceData.ownerId || resourceData._id;
  
  // Check authorization with the owner ID
  const authResult = isAllowed({
    ...context,
    ownerId: String(ownerId)
  });
  
  return {
    ...authResult,
    resource: resourceData
  };
}

/**
 * Create a filter for list endpoints based on user permissions
 * Returns a MongoDB filter that restricts results to what the user can see
 */
export function createListFilter(
  role: Role,
  action: Action,
  resource: Resource,
  sessionUserId: string
): Record<string, any> {
  // Normalize role to handle legacy values
  const normalizedRole = normalizeRole(role);
  const permission = getPermission(normalizedRole, action, resource);
  
  // If user can see any resources, no filter needed
  if (permission.any) {
    return {};
  }
  
  // If user can only see own resources, filter by owner
  if (permission.own) {
    return {
      $or: [
        { userId: sessionUserId },
        { agentId: sessionUserId },
        { ownerId: sessionUserId },
        { _id: sessionUserId }  // For user profile access
      ]
    };
  }
  
  // If no permissions, return a filter that matches nothing
  return { _id: { $exists: false } };
}

/**
 * Validate that a user can perform an action on a resource
 * Throws an error if not allowed
 */
export function requireAuth(context: AuthContext): void {
  const result = isAllowed(context);
  
  if (!result.allowed) {
    const error = new Error(`Authorization denied: ${result.reason}`);
    (error as any).statusCode = 403;
    (error as any).authContext = context;
    throw error;
  }
}

/**
 * Check if a user can access a route based on their role
 */
export function canAccessRoute(role: Role, route: string): boolean {
  // Define route access rules
  const routeRules: Record<string, Role[]> = {
    '/admin': ['superadmin'],
    '/agent': ['agent', 'superadmin'],
    '/dashboard': ['user', 'agent', 'superadmin'],
    '/profile': ['user', 'agent', 'superadmin']
  };
  
  // Normalize role to handle legacy values
  const normalizedRole = normalizeRole(role);
  
  // Check if the route has specific rules
  for (const [routePattern, allowedRoles] of Object.entries(routeRules)) {
    if (route.startsWith(routePattern)) {
      return allowedRoles.includes(normalizedRole);
    }
  }
  
  // Default: allow access to all routes (public routes)
  return true;
}

/**
 * Normalize role values to handle legacy and new role formats
 */
function normalizeRole(role: string): Role {
  switch (role) {
    case 'super_admin':
    case 'superadmin':
      return 'superadmin';
    case 'agent':
    case 'agency':
      return 'agent';
    case 'user':
    case 'normal_user':
      return 'user';
    default:
      return 'user';
  }
}

/**
 * Get the appropriate redirect path for a user based on their role
 */
export function getDefaultRoute(role: Role): string {
  const normalizedRole = normalizeRole(role);
  
  switch (normalizedRole) {
    case 'superadmin':
      return '/admin';
    case 'agent':
      return '/agent';
    case 'user':
    default:
      return '/dashboard';
  }
}

/**
 * Sanitize data for mass assignment protection
 * Only allows specified fields to be updated
 */
export function sanitizeUpdateData<T extends Record<string, any>>(
  data: T,
  allowedFields: (keyof T)[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (field in data) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}

/**
 * Ensure ownerId is set to the session user ID
 * Prevents clients from setting arbitrary owner IDs
 */
export function enforceOwnership<T extends Record<string, any>>(
  data: T,
  sessionUserId: string,
  ownerField: keyof T = 'userId'
): T {
  return {
    ...data,
    [ownerField]: sessionUserId
  };
}


