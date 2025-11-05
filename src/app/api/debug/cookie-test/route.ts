import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies = request.cookies.getAll()
    const kobacSession = request.cookies.get('kobac_session')
    
    // Parse session if it exists
    let sessionData = null
    let sessionError = null
    
    if (kobacSession?.value) {
      try {
        sessionData = JSON.parse(decodeURIComponent(kobacSession.value))
      } catch (error) {
        sessionError = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Get headers that might affect cookies
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'host': request.headers.get('host'),
      'origin': request.headers.get('origin'),
      'referer': request.headers.get('referer'),
      'cookie': request.headers.get('cookie'),
    }

    // Test setting a test cookie
    const res = NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        allCookies: allCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value.substring(0, 100) + (cookie.value.length > 100 ? '...' : ''),
          length: cookie.value.length
        })),
        kobacSession: {
          exists: !!kobacSession,
          value: kobacSession?.value ? kobacSession.value.substring(0, 100) + '...' : null,
          length: kobacSession?.value?.length || 0
        },
        sessionData,
        sessionError,
        headers,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isProduction: process.env.NODE_ENV === 'production'
        }
      }
    })

    // Set a test cookie to see if cookie setting works
    res.cookies.set('test_cookie', 'test_value_' + Date.now(), {
      httpOnly: false, // Make it visible in browser
      sameSite: 'lax',
      secure: false, // Allow HTTP in development
      path: '/',
      maxAge: 60 * 60, // 1 hour
      domain: undefined
    })

    // Also set a test session cookie
    res.cookies.set('test_session', 'test_session_' + Date.now(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: 60 * 60,
      domain: undefined
    })

    return res
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, cookieName, cookieValue } = body

    if (action === 'set') {
      const res = NextResponse.json({ success: true, message: 'Cookie set' })
      
      res.cookies.set(cookieName || 'test_cookie', cookieValue || 'test_value', {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60,
        domain: undefined
      })

      return res
    }

    if (action === 'clear') {
      const res = NextResponse.json({ success: true, message: 'Cookie cleared' })
      
      res.cookies.set(cookieName || 'test_cookie', '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0)
      })

      return res
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
