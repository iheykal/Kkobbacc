import { NextRequest, NextResponse } from 'next/server'
import { canAccessRoute, getDefaultRoute } from './lib/authz/authorize'
import { Role } from './lib/authz/policy'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware - Processing request for:', pathname)

  // Skip middleware for API routes, static files, and public routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/uploads/') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/register-agent' ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/test')
  ) {
    console.log('✅ Middleware - Skipping middleware for:', pathname)
    return NextResponse.next()
  }

  // Get session from cookie - check both possible cookie names
  let raw = request.cookies.get('kobac_session')?.value
  if (!raw) {
    raw = request.cookies.get('kobac_session_alt')?.value
  }
  
  console.log('🔍 Middleware - Session cookie exists:', !!raw)
  console.log('🔍 Middleware - Available cookies:', request.cookies.getAll().map(c => c.name))
  
  if (!raw) {
    // No session - redirect to home page
    console.log('❌ Middleware - No session cookie found, redirecting to home')
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  try {
    const session = JSON.parse(decodeURIComponent(raw)) as { 
      userId?: string; 
      role?: string;
      sessionId?: string;
    }
    
    if (!session?.userId || !session?.role) {
      // Invalid session - redirect to home page
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    const role = session.role
    console.log('🔍 Middleware - User role:', role, 'Requested path:', pathname)
    
    // Check if user can access the requested route (normalizeRole is called inside canAccessRoute)
    const canAccess = canAccessRoute(role as Role, pathname)
    console.log('🔍 Middleware - Can access route:', canAccess)
    
    if (!canAccess) {
      // User doesn't have permission - redirect to their default route
      const defaultRoute = getDefaultRoute(role as any)
      console.log('❌ Middleware - Access denied, redirecting to:', defaultRoute)
      const url = request.nextUrl.clone()
      url.pathname = defaultRoute
      return NextResponse.redirect(url)
    }

    // User has permission - allow access
    console.log('✅ Middleware - Access granted for:', pathname)
    return NextResponse.next()

  } catch (error) {
    console.error('Middleware session parsing error:', error)
    // Invalid session format - redirect to home page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agent/:path*',
    '/dashboard/:path*',
    '/profile/:path*'
  ]
}


