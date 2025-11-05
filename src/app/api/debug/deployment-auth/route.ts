import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Deployment Auth Debug - Starting...');
    
    // Get all cookies
    const allCookies = request.cookies.getAll();
    console.log('🍪 All cookies:', allCookies.map(c => ({ 
      name: c.name, 
      length: c.value.length,
      hasValue: !!c.value 
    })));
    
    // Check environment variables
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: process.env.VERCEL === '1'
    };
    
    console.log('🌍 Environment info:', envInfo);
    
    // Check session cookies
    let sessionCookie = request.cookies.get('kobac_session')?.value;
    let altSessionCookie = request.cookies.get('kobac_session_alt')?.value;
    
    let sessionData = null;
    let altSessionData = null;
    
    if (sessionCookie) {
      try {
        sessionData = JSON.parse(decodeURIComponent(sessionCookie));
        console.log('✅ Primary session parsed:', { userId: sessionData?.userId, role: sessionData?.role });
      } catch (error) {
        console.log('❌ Primary session parse error:', error);
      }
    }
    
    if (altSessionCookie) {
      try {
        altSessionData = JSON.parse(decodeURIComponent(altSessionCookie));
        console.log('✅ Alt session parsed:', { userId: altSessionData?.userId, role: altSessionData?.role });
      } catch (error) {
        console.log('❌ Alt session parse error:', error);
      }
    }
    
    // Check headers
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'host': request.headers.get('host'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer')
    };
    
    console.log('📋 Request headers:', headers);
    
    const debugInfo: {
      timestamp: string;
      environment: any;
      cookies: any;
      session: any;
      headers: any;
      recommendations: string[];
    } = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      cookies: {
        total: allCookies.length,
        sessionCookie: !!sessionCookie,
        altSessionCookie: !!altSessionCookie,
        allCookieNames: allCookies.map(c => c.name)
      },
      session: {
        primary: sessionData ? { userId: sessionData.userId, role: sessionData.role } : null,
        alt: altSessionData ? { userId: altSessionData.userId, role: altSessionData.role } : null
      },
      headers: headers,
      recommendations: []
    };
    
    // Add recommendations based on findings
    if (!sessionCookie && !altSessionCookie) {
      debugInfo.recommendations.push('No session cookies found - user needs to login');
    }
    
    if (envInfo.isProduction && !envInfo.isVercel) {
      debugInfo.recommendations.push('Production environment detected but not on Vercel - check cookie security settings');
    }
    
    if (sessionData && sessionData.role === 'superadmin') {
      debugInfo.recommendations.push('Superadmin session detected - should redirect to /admin');
    }
    
    console.log('✅ Deployment Auth Debug completed');
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    console.error('❌ Deployment Auth Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
