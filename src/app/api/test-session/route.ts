import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing session...');
    console.log('🍪 All cookies:', request.cookies.getAll().map(c => c.name));
    
    const cookie = request.cookies.get('kobac_session')?.value;
    console.log('🍪 Session cookie found:', !!cookie);
    
    if (!cookie) {
      return NextResponse.json({ 
        authenticated: false, 
        error: 'No session cookie found',
        cookies: request.cookies.getAll().map(c => c.name)
      });
    }
    
    try {
      const session = JSON.parse(decodeURIComponent(cookie));
      console.log('📋 Session parsed:', session);
      
      return NextResponse.json({ 
        authenticated: true, 
        session,
        cookies: request.cookies.getAll().map(c => c.name)
      });
    } catch (error) {
      console.log('❌ Invalid session cookie:', error);
      return NextResponse.json({ 
        authenticated: false, 
        error: 'Invalid session cookie',
        cookies: request.cookies.getAll().map(c => c.name)
      });
    }
  } catch (error) {
    console.error('❌ Session test error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
