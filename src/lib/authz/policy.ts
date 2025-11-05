/**
 * Authorization Policy
 * 
 * Defines permissions for different roles and actions on resources.
 * Each permission has two levels:
 * - any: Can perform action on any resource (admin-level)
 * - own: Can perform action only on own resources (user-level)
 */

export type Role = 'user' | 'agent' | 'superadmin';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource = 
  | 'property' 
  | 'user' 
  | 'profile' 
  | 'media' 
  | 'booking' 
  | 'admin';

export interface Permission {
  any: boolean;  // Can perform action on any resource
  own: boolean;  // Can perform action on own resources only
}

export type Policy = Record<Role, Record<Action, Record<Resource, Permission>>>;

/**
 * Authorization Policy Matrix
 * 
 * Structure: role -> action -> resource -> { any: boolean, own: boolean }
 */
export const POLICY: Policy = {
  user: {
    create: {
      property: { any: false, own: false },  // Users cannot create properties
      user: { any: false, own: false },      // Users cannot create other users
      profile: { any: false, own: true },    // Users can update their own profile
      media: { any: false, own: false },     // Users cannot upload media
      booking: { any: false, own: true },    // Users can create their own bookings
      admin: { any: false, own: false }      // Users cannot access admin functions
    },
    read: {
      property: { any: true, own: false },   // Users can view all properties (public)
      user: { any: false, own: true },       // Users can view their own profile
      profile: { any: false, own: true },    // Users can view their own profile
      media: { any: true, own: false },      // Users can view all media (public)
      booking: { any: false, own: true },    // Users can view their own bookings
      admin: { any: false, own: false }      // Users cannot access admin data
    },
    update: {
      property: { any: false, own: false },  // Users cannot update properties
      user: { any: false, own: true },       // Users can update their own profile
      profile: { any: false, own: true },    // Users can update their own profile
      media: { any: false, own: false },     // Users cannot update media
      booking: { any: false, own: true },    // Users can update their own bookings
      admin: { any: false, own: false }      // Users cannot update admin data
    },
    delete: {
      property: { any: false, own: false },  // Users cannot delete properties
      user: { any: false, own: false },      // Users cannot delete accounts
      profile: { any: false, own: false },   // Users cannot delete profiles
      media: { any: false, own: false },     // Users cannot delete media
      booking: { any: false, own: true },    // Users can delete their own bookings
      admin: { any: false, own: false }      // Users cannot delete admin data
    }
  },

  agent: {
    create: {
      property: { any: false, own: true },   // Agents can create their own properties
      user: { any: false, own: false },      // Agents cannot create users
      profile: { any: false, own: true },    // Agents can update their own profile
      media: { any: false, own: true },      // Agents can upload their own media
      booking: { any: false, own: true },    // Agents can create bookings for their properties
      admin: { any: false, own: false }      // Agents cannot access admin functions
    },
    read: {
      property: { any: true, own: false },   // Agents can view all properties (public)
      user: { any: false, own: true },       // Agents can view their own profile
      profile: { any: false, own: true },    // Agents can view their own profile
      media: { any: true, own: false },      // Agents can view all media (public)
      booking: { any: false, own: true },    // Agents can view bookings for their properties
      admin: { any: false, own: false }      // Agents cannot access admin data
    },
    update: {
      property: { any: false, own: true },   // Agents can update their own properties
      user: { any: false, own: true },       // Agents can update their own profile
      profile: { any: false, own: true },    // Agents can update their own profile
      media: { any: false, own: true },      // Agents can update their own media
      booking: { any: false, own: true },    // Agents can update bookings for their properties
      admin: { any: false, own: false }      // Agents cannot update admin data
    },
    delete: {
      property: { any: false, own: true },   // Agents can delete their own properties
      user: { any: false, own: false },      // Agents cannot delete accounts
      profile: { any: false, own: false },   // Agents cannot delete profiles
      media: { any: false, own: true },      // Agents can delete their own media
      booking: { any: false, own: true },    // Agents can delete bookings for their properties
      admin: { any: false, own: false }      // Agents cannot delete admin data
    }
  },

  superadmin: {
    create: {
      property: { any: true, own: true },    // Superadmin can create any property
      user: { any: true, own: true },        // Superadmin can create any user
      profile: { any: true, own: true },     // Superadmin can create any profile
      media: { any: true, own: true },       // Superadmin can upload any media
      booking: { any: true, own: true },     // Superadmin can create any booking
      admin: { any: true, own: true }        // Superadmin can access all admin functions
    },
    read: {
      property: { any: true, own: true },    // Superadmin can view any property
      user: { any: true, own: true },        // Superadmin can view any user
      profile: { any: true, own: true },     // Superadmin can view any profile
      media: { any: true, own: true },       // Superadmin can view any media
      booking: { any: true, own: true },     // Superadmin can view any booking
      admin: { any: true, own: true }        // Superadmin can access all admin data
    },
    update: {
      property: { any: true, own: true },    // Superadmin can update any property
      user: { any: true, own: true },        // Superadmin can update any user
      profile: { any: true, own: true },     // Superadmin can update any profile
      media: { any: true, own: true },       // Superadmin can update any media
      booking: { any: true, own: true },     // Superadmin can update any booking
      admin: { any: true, own: true }        // Superadmin can update any admin data
    },
    delete: {
      property: { any: true, own: true },    // Superadmin can delete any property
      user: { any: true, own: true },        // Superadmin can delete any user
      profile: { any: true, own: true },     // Superadmin can delete any profile
      media: { any: true, own: true },       // Superadmin can delete any media
      booking: { any: true, own: true },     // Superadmin can delete any booking
      admin: { any: true, own: true }        // Superadmin can delete any admin data
    }
  }
};

/**
 * Get permission for a role, action, and resource
 */
export function getPermission(role: Role, action: Action, resource: Resource): Permission {
  return POLICY[role][action][resource];
}

/**
 * Check if a role can perform an action on any resource
 */
export function canPerformAny(role: Role, action: Action, resource: Resource): boolean {
  return POLICY[role][action][resource].any;
}

/**
 * Check if a role can perform an action on own resources
 */
export function canPerformOwn(role: Role, action: Action, resource: Resource): boolean {
  return POLICY[role][action][resource].own;
}

/**
 * Get all resources a role can access for a given action
 */
export function getAccessibleResources(role: Role, action: Action): Resource[] {
  const resources: Resource[] = [];
  
  for (const resource of Object.keys(POLICY[role][action]) as Resource[]) {
    const permission = POLICY[role][action][resource];
    if (permission.any || permission.own) {
      resources.push(resource);
    }
  }
  
  return resources;
}

/**
 * Check if a role has any access to a resource for a given action
 */
export function hasAccess(role: Role, action: Action, resource: Resource): boolean {
  const permission = POLICY[role][action][resource];
  return permission.any || permission.own;
}
