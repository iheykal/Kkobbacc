import { NextRequest, NextResponse } from 'next/server'
import { canAccessRoute, getDefaultRoute } from './lib/authz/authorize'
import { Role } from './lib/authz/policy'

// Helper function to add security headers to any response
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.dicebear.com https://www.google-analytics.com; frame-src 'self';"
  )
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔍 Middleware - Processing request for:', pathname)

  // Check if this is a public route
  const isPublicRoute = 
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

  // For public routes, return early with security headers
  if (isPublicRoute) {
    console.log('✅ Middleware - Skipping middleware for:', pathname)
    const response = NextResponse.next()
    return addSecurityHeaders(response)
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
    const response = NextResponse.redirect(url)
    return addSecurityHeaders(response)
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
      const response = NextResponse.redirect(url)
      return addSecurityHeaders(response)
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
      const response = NextResponse.redirect(url)
      return addSecurityHeaders(response)
    }

    // User has permission - allow access
    console.log('✅ Middleware - Access granted for:', pathname)
    const response = NextResponse.next()
    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Middleware session parsing error:', error)
    // Invalid session format - redirect to home page
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const response = NextResponse.redirect(url)
    return addSecurityHeaders(response)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
