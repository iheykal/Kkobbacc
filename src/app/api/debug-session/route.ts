import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check session status
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll();
    
    // Try to get session
    const session = getSessionFromRequest(request);
    
    return NextResponse.json({
      success: true,
      debug: {
        cookies: allCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
          isKobacSession: c.name.includes('kobac')
        })),
        session: session ? {
          userId: session.userId,
          role: session.role,
          hasSessionId: !!session.sessionId,
          createdAt: session.createdAt
        } : null,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug session',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}