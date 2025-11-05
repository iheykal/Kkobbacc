# Authorization System Documentation

## Overview

This document describes the comprehensive role-based authorization system implemented in the KOBAC real estate application. The system enforces fine-grained permissions, ownership checks, and role-specific access controls across all API endpoints and UI components.

## Architecture

### Core Components

1. **Policy Engine** (`src/lib/authz/policy.ts`) - Defines permissions matrix
2. **Authorization Helpers** (`src/lib/authz/authorize.ts`) - Core authorization logic
3. **Session Management** (`src/lib/sessionUtils.ts`) - Session handling and validation
4. **Middleware Guards** (`src/middleware.ts`) - Route-level protection
5. **UI Components** - Role-based navigation and access controls

### Role Hierarchy

```
superadmin (highest)
    ↓
agent
    ↓
user (lowest)
```

## Roles and Permissions

### User Role
- **Can Read**: All properties (public), own profile, own bookings
- **Can Create**: Own bookings, own profile updates
- **Can Update**: Own profile, own bookings
- **Can Delete**: Own bookings
- **Cannot Access**: Agent dashboard, admin panel, other users' data

### Agent Role
- **Can Read**: All properties (public), own profile, own properties, own bookings
- **Can Create**: Own properties, own media, own bookings, own profile updates
- **Can Update**: Own properties, own media, own bookings, own profile
- **Can Delete**: Own properties, own media, own bookings
- **Cannot Access**: Admin panel, other agents' data

### Superadmin Role
- **Can Do Everything**: Full access to all resources and actions
- **Special Access**: Admin panel, user management, system configuration

## Usage Examples

### 1. Basic Authorization Check

```typescript
import { isAllowed } from '@/lib/authz/authorize';

// Check if user can update a property
const context = {
  sessionUserId: 'user123',
  role: 'agent',
  action: 'update',
  resource: 'property',
  ownerId: 'user123' // The property owner
};

const result = isAllowed(context);
if (result.allowed) {
  // User can perform the action
  console.log(`Access granted with scope: ${result.scope}`);
} else {
  // Access denied
  console.log(`Access denied: ${result.reason}`);
}
```

### 2. Resource-Specific Authorization

```typescript
import { canAccessResource } from '@/lib/authz/authorize';
import Property from '@/models/Property';

// Check if user can access a specific property
const authResult = await canAccessResource(
  {
    sessionUserId: session.userId,
    role: session.role,
    action: 'update',
    resource: 'property',
    resourceId: propertyId
  },
  async (id: string) => {
    return await Property.findById(id);
  }
);

if (!authResult.allowed) {
  return NextResponse.json({ error: 'Property not found' }, { status: 404 });
}

// Use authResult.resource for the loaded property
```

### 3. List Endpoint Filtering

```typescript
import { createListFilter } from '@/lib/authz/authorize';

// Create MongoDB filter based on user permissions
const authFilter = createListFilter(session.role, 'read', 'property', session.userId);

// Apply filter to database query
const properties = await Property.find({
  deletionStatus: { $ne: 'deleted' },
  ...authFilter
});
```

### 4. Mass Assignment Protection

```typescript
import { sanitizeUpdateData, enforceOwnership } from '@/lib/authz/authorize';

// Sanitize update data
const allowedFields = ['title', 'price', 'description', 'status'];
const sanitizedData = sanitizeUpdateData(requestBody, allowedFields);

// Enforce ownership on creation
const propertyData = enforceOwnership(sanitizedData, session.userId, 'agentId');
```

### 5. Route Protection

```typescript
import { requireAuth } from '@/lib/authz/authorize';

// Throw error if not authorized
requireAuth({
  sessionUserId: session.userId,
  role: session.role,
  action: 'delete',
  resource: 'property',
  ownerId: property.agentId
});
```

## API Route Implementation

### Example: Property CRUD Routes

```typescript
// GET /api/properties - List properties with authorization filtering
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authFilter = createListFilter(session.role, 'read', 'property', session.userId);
  const properties = await Property.find({ ...authFilter });
  
  return NextResponse.json({ data: properties });
}

// POST /api/properties - Create property with ownership enforcement
export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorized();

  const authResult = isAllowed({
    sessionUserId: session.userId,
    role: session.role,
    action: 'create',
    resource: 'property'
  });

  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const sanitizedData = sanitizeUpdateData(body, allowedFields);
  const propertyData = enforceOwnership(sanitizedData, session.userId, 'agentId');
  
  const property = new Property(propertyData);
  await property.save();
  
  return NextResponse.json({ data: property }, { status: 201 });
}

// PUT /api/properties/[id] - Update property with ownership check
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorized();

  const authResult = await canAccessResource(
    {
      sessionUserId: session.userId,
      role: session.role,
      action: 'update',
      resource: 'property',
      resourceId: params.id
    },
    async (id: string) => await Property.findById(id)
  );

  if (!authResult.allowed) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const body = await request.json();
  const sanitizedData = sanitizeUpdateData(body, allowedFields);
  
  const updatedProperty = await Property.findByIdAndUpdate(
    params.id,
    sanitizedData,
    { new: true }
  );

  return NextResponse.json({ data: updatedProperty });
}
```

## Frontend Usage

### 1. Role-Based Navigation

```typescript
import { RoleBasedNavigation } from '@/components/navigation/RoleBasedNavigation';

function Layout({ user, onLogout, children }) {
  return (
    <div>
      <RoleBasedNavigation user={user} onLogout={onLogout} />
      {children}
    </div>
  );
}
```

### 2. Component-Level Access Control

```typescript
import { RoleGuard } from '@/components/authz/RoleGuard';

function PropertyManagement() {
  return (
    <RoleGuard allowedRoles={['agent', 'superadmin']}>
      <PropertyForm />
    </RoleGuard>
  );
}

function AdminPanel() {
  return (
    <RoleGuard allowedRoles="superadmin" fallback={<AccessDenied />}>
      <AdminDashboard />
    </RoleGuard>
  );
}
```

### 3. Hook-Based Access Control

```typescript
import { useRoleAccess } from '@/hooks/useRoleAccess';

function MyComponent() {
  const { canSee, isAdmin, hasRole } = useRoleAccess();

  return (
    <div>
      {canSee('admin-panel') && <AdminButton />}
      {isAdmin() && <SystemSettings />}
      {hasRole(['agent', 'superadmin']) && <PropertyActions />}
    </div>
  );
}
```

## Adding New Resources

### 1. Update Policy

```typescript
// In src/lib/authz/policy.ts
export type Resource = 
  | 'property' 
  | 'user' 
  | 'profile' 
  | 'media' 
  | 'booking' 
  | 'admin'
  | 'newResource'; // Add new resource

// Add permissions for the new resource in POLICY
export const POLICY: Policy = {
  user: {
    create: {
      // ... existing resources
      newResource: { any: false, own: true }, // Users can create their own
    },
    read: {
      // ... existing resources
      newResource: { any: false, own: true }, // Users can read their own
    },
    // ... other actions
  },
  // ... other roles
};
```

### 2. Create API Routes

```typescript
// src/app/api/new-resource/route.ts
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return unauthorized();

  const authFilter = createListFilter(session.role, 'read', 'newResource', session.userId);
  const resources = await NewResource.find({ ...authFilter });
  
  return NextResponse.json({ data: resources });
}
```

### 3. Add Frontend Components

```typescript
// Add to useRoleAccess hook
const canSee = (element: string): boolean => {
  switch (element) {
    // ... existing cases
    case 'new-resource-management':
      return hasRole(['agent', 'superadmin']);
    default:
      return true;
  }
};
```

## Security Best Practices

### 1. Server-Side Validation
- **Always validate on the server** - Frontend checks are for UX only
- Use `isAllowed()` for all API endpoints
- Implement `canAccessResource()` for resource-specific operations

### 2. Mass Assignment Protection
- Use `sanitizeUpdateData()` to whitelist allowed fields
- Use `enforceOwnership()` to prevent ownership hijacking
- Never trust client-sent owner IDs

### 3. Error Handling
- Return 404 for private resources not owned by user
- Return 403 for general forbidden actions
- Log authorization failures for monitoring

### 4. Session Security
- Validate session on every request
- Regenerate session IDs on role changes
- Use secure cookies in production

## Testing

### Running Tests

```bash
# Run all authorization tests
npm test src/__tests__/authz/

# Run specific test files
npm test src/__tests__/authz/policy.test.ts
npm test src/__tests__/authz/authorize.test.ts
npm test src/__tests__/authz/integration.test.ts
```

### Test Coverage

The test suite covers:
- Policy matrix validation
- Authorization function behavior
- Resource access scenarios
- List filtering logic
- Mass assignment protection
- Edge cases and error handling

## Monitoring and Logging

### Authorization Logs

```typescript
// Log authorization decisions
console.log('Authorization check:', {
  userId: session.userId,
  role: session.role,
  action,
  resource,
  allowed: result.allowed,
  reason: result.reason
});
```

### Key Metrics to Monitor

1. **Authorization Failures** - Track denied access attempts
2. **Role Distribution** - Monitor user role assignments
3. **Resource Access Patterns** - Understand usage patterns
4. **Session Security** - Monitor session regeneration

## Troubleshooting

### Common Issues

1. **"Property not found" errors**
   - Check if user has permission to access the resource
   - Verify ownership in the database
   - Ensure proper session validation

2. **"Forbidden" errors**
   - Check user role and permissions
   - Verify the action is allowed for the resource
   - Review the policy matrix

3. **Session issues**
   - Ensure cookies are properly set
   - Check session expiration
   - Verify session regeneration on login

### Debug Mode

```typescript
// Enable debug logging
process.env.AUTHZ_DEBUG = 'true';

// This will log all authorization decisions
```

## Migration Guide

### From Old System

1. **Update API Routes**
   - Replace manual role checks with `isAllowed()`
   - Add `createListFilter()` to list endpoints
   - Implement `canAccessResource()` for individual resources

2. **Update Frontend**
   - Replace manual role checks with `useRoleAccess()`
   - Use `RoleGuard` components for conditional rendering
   - Implement role-based navigation

3. **Database Updates**
   - Ensure all resources have proper ownership fields
   - Add indexes for ownership queries
   - Update existing data to have proper owner IDs

## Future Enhancements

### Planned Features

1. **Multi-Tenant Support**
   - Add `tenantId` to authorization context
   - Implement tenant-based filtering
   - Add tenant isolation checks

2. **Advanced Permissions**
   - Custom permission sets per user
   - Time-based permissions
   - Location-based restrictions

3. **Audit Trail**
   - Log all authorization decisions
   - Track permission changes
   - Generate compliance reports

4. **Performance Optimization**
   - Cache authorization decisions
   - Optimize database queries
   - Implement permission preloading

## Conclusion

This authorization system provides a robust, scalable foundation for role-based access control. It enforces security at multiple layers while maintaining flexibility for future enhancements. Always remember that security is a process, not a product - regular audits and updates are essential for maintaining a secure system.


