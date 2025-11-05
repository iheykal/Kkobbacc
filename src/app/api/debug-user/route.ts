import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check session cookie
    const cookie = request.cookies.get('kobac_session')?.value
    console.log('🍪 Session cookie found:', !!cookie)
    
    if (!cookie) {
      return NextResponse.json({ 
        success: false, 
        error: 'No session cookie found',
        debug: {
          hasCookie: false,
          cookieValue: null
        }
      })
    }
    
    let session: { userId: string; role: string } | null = null
    try { 
      session = JSON.parse(decodeURIComponent(cookie)) 
      console.log('📋 Session parsed:', session)
    } catch (error) {
      console.log('❌ Failed to parse session:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session cookie',
        debug: {
          hasCookie: true,
          cookieValue: cookie,
          parseError: error
        }
      })
    }
    
    if (!session?.userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No userId in session',
        debug: {
          hasCookie: true,
          session: session
        }
      })
    }
    
    // Get user from database
    const user = await User.findById(session.userId).select('_id fullName phone role status createdAt')
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database',
        debug: {
          hasCookie: true,
          session: session,
          userId: session.userId
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      },
      debug: {
        hasCookie: true,
        session: session,
        databaseUser: {
          id: user._id,
          role: user.role,
          status: user.status
        }
      }
    })
    
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}
