import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Debug: Log all cookies
    const allCookies = request.cookies.getAll()
    console.log('🔍 Debug Session Admin - All cookies:', allCookies.map(c => ({ name: c.name, length: c.value.length })))
    
    // Check both possible cookie names
    let cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      cookie = request.cookies.get('kobac_session_alt')?.value
    }
    console.log('🔍 Debug Session Admin - Session cookie exists:', !!cookie)
    
    if (!cookie) {
      console.log('❌ Debug Session Admin - No kobac_session cookie found')
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated - no session cookie found',
        debug: { 
          allCookies: allCookies.map(c => c.name),
          cookieNames: ['kobac_session', 'kobac_session_alt'],
          foundCookies: allCookies.filter(c => c.name.includes('kobac'))
        }
      }, { status: 401 })
    }
    
    let session: { userId: string; role: string } | null = null
    try { 
      session = JSON.parse(decodeURIComponent(cookie))
      console.log('✅ Debug Session Admin - Session parsed successfully:', { userId: session?.userId, role: session?.role })
    } catch (e) {
      console.log('❌ Debug Session Admin - Failed to parse session cookie:', e)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session cookie format',
        debug: { cookieLength: cookie.length, cookieStart: cookie.substring(0, 50) }
      }, { status: 401 })
    }
    
    if (!session?.userId) {
      console.log('❌ Debug Session Admin - No userId in session')
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session - no userId',
        debug: { session }
      }, { status: 401 })
    }
    
    const user = await User.findById(session.userId)
    if (!user) {
      console.log('❌ Debug Session Admin - User not found in database')
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        debug: { userId: session.userId }
      }, { status: 401 })
    }
    
    // Check if user is superadmin (support both role formats)
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    console.log('🔍 Debug Session Admin - User details:', {
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      isSuperAdmin,
      phone: user.phone
    })
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          isSuperAdmin
        },
        session: {
          userId: session.userId,
          role: session.role
        },
        debug: {
          allCookies: allCookies.map(c => ({ name: c.name, length: c.value.length })),
          cookieFound: !!cookie,
          sessionValid: !!session,
          userFound: !!user
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Debug Session Admin - Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', debug: { error: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    )
  }
}
