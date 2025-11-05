import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Session auth from cookie set on login
    const cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No session cookie',
        status: 401,
        statusText: 'Unauthorized'
      }, { status: 401 })
    }

    let session: { userId: string; role: string } | null = null
    try {
      session = JSON.parse(decodeURIComponent(cookie))
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid session cookie',
        status: 401,
        statusText: 'Unauthorized',
        debug: { cookieError: error instanceof Error ? error.message : 'Unknown error' }
      }, { status: 401 })
    }
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No session data',
        status: 401,
        statusText: 'Unauthorized'
      }, { status: 401 })
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - User not found',
        status: 401,
        statusText: 'Unauthorized'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        phone: user.phone
      },
      session: {
        isAuthenticated: true,
        hasRole: !!user.role,
        sessionData: session
      }
    })

  } catch (error) {
    console.error('Error debugging session:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
