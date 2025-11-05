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
        authenticated: false
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
        authenticated: false
      })
    }
    
    if (!session?.userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No userId in session',
        authenticated: false
      })
    }
    
    // Get user from database
    const user = await User.findById(session.userId).select('_id fullName phone role status')
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database',
        authenticated: false
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      authenticated: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    })
    
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      authenticated: false
    }, { status: 500 })
  }
}
