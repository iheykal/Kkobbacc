import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing session cookie setting...');
    
    // Create a test session
    const testSession = {
      userId: '68bdbf0802eba5353c2eef66',
      role: 'superadmin'
    };
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Test session set',
      session: testSession
    });
    
    // Set the session cookie
    setSessionCookie(response, testSession, false);
    
    console.log('🍪 Session cookie set in response');
    
    return response;
    
  } catch (error) {
    console.error('❌ Error setting test session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set test session' },
      { status: 500 }
    );
  }
}
