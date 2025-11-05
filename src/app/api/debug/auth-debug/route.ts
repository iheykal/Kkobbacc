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
    }

    return NextResponse.json({
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
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
