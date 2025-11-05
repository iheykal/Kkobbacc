import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Debug: Log all cookies
    const allCookies = request.cookies.getAll()
    console.log('🔍 Auth/me - All cookies:', allCookies.map(c => ({ name: c.name, length: c.value.length })))
    
    // Check both possible cookie names
    let cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      cookie = request.cookies.get('kobac_session_alt')?.value
    }
    console.log('🔍 Auth/me - Session cookie exists:', !!cookie)
    
    if (!cookie) {
      console.log('❌ Auth/me - No kobac_session cookie found')
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated - no session cookie found',
        debug: { allCookies: allCookies.map(c => c.name) }
      }, { status: 401 })
    }
    
    let session: { userId: string; role: string } | null = null
    try { 
      session = JSON.parse(decodeURIComponent(cookie))
      console.log('✅ Auth/me - Session parsed successfully:', { userId: session?.userId, role: session?.role })
    } catch (parseError) {
      console.log('❌ Auth/me - Failed to parse session cookie:', parseError)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session cookie format',
        debug: { parseError: parseError instanceof Error ? parseError.message : 'Unknown error' }
      }, { status: 401 })
    }
    
    if (!session?.userId) {
      console.log('❌ Auth/me - No userId in session')
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session - no userId found',
        debug: { session }
      }, { status: 401 })
    }
    
    const user = await User.findById(session.userId).select('_id fullName phone role status createdAt profile.avatar')
    if (!user) {
      console.log('❌ Auth/me - User not found in database:', session.userId)
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database',
        debug: { userId: session.userId }
      }, { status: 500 })
    }
    
    console.log('✅ Auth/me - User authenticated successfully:', user.fullName)
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.profile?.avatar,
        createdAt: user.createdAt
      } 
    })
  } catch (e) {
    console.error('❌ Auth/me - Server error:', e)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      debug: { 
        error: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined
      }
    }, { status: 500 })
  }
}


