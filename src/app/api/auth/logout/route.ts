import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🚪 Logout request received')
  
  // Determine if we're in production
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' })
  
  // Clear the session cookie with proper security settings
  const clearOptions = {
    path: '/', 
    maxAge: 0,
    expires: new Date(0),
    domain: undefined,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd // Match production environment
  };
  
  console.log('🍪 Logout - Clearing cookies with options:', { 
    isProd, 
    secure: clearOptions.secure, 
    sameSite: clearOptions.sameSite 
  });
  
  res.cookies.set('kobac_session', '', clearOptions);
  res.cookies.set('kobac_session_alt', '', clearOptions);
  
  // Also try to clear with different variations to ensure it's gone
  res.cookies.set('kobac_session', '', { 
    path: '/admin', 
    maxAge: 0,
    expires: new Date(0),
    secure: isProd
  });
  
  res.cookies.set('kobac_session', '', { 
    path: '/api', 
    maxAge: 0,
    expires: new Date(0),
    secure: isProd
  });
  
  // Set a logout flag cookie to prevent auto-login
  res.cookies.set('kobac_logout', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: false, // Allow client-side access
    sameSite: 'lax',
    secure: isProd
  });
  
  console.log('✅ Session cookies cleared and logout flag set')
  
  return res;
}


