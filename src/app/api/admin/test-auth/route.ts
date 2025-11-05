import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/sessionUtils'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing authentication...')
    
    // Log all cookies
    const allCookies = request.cookies.getAll()
    console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, length: c.value.length })))
    
    // Check session
    const session = getSessionFromRequest(request)
    console.log('🔍 Session result:', session)
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid session found',
        debug: { 
          cookies: allCookies.map(c => c.name),
          hasKobacSession: !!request.cookies.get('kobac_session'),
          hasKobacSessionAlt: !!request.cookies.get('kobac_session_alt')
        }
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      success: true, 
      session: {
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId
      }
    })
    
  } catch (error) {
    console.error('❌ Test auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
}

