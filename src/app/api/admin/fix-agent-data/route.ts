import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Session auth from cookie set on login
    const cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let session: { userId: string; role: string } | null = null
    try {
      session = JSON.parse(decodeURIComponent(cookie))
    } catch (_) {}
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin (support both role formats)
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      console.log('Access denied. User role:', user.role, 'User:', user.fullName)
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint',
        debug: { userRole: user.role, userName: user.fullName }
      }, { status: 403 })
    }

    // Get all properties that have agent data
    const propertiesWithAgentData = await Property.find({ agent: { $exists: true } })
    
    let fixedCount = 0
    let errors = []

    for (const property of propertiesWithAgentData) {
      try {
        // Remove the hardcoded agent data and keep only agentId
        await Property.findByIdAndUpdate(property._id, {
          $unset: { agent: 1 }
        })
        fixedCount++
      } catch (error) {
        errors.push(`Failed to fix property ${property.propertyId}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Fixed ${fixedCount} properties by removing hardcoded agent data`,
        fixedCount,
        totalPropertiesWithAgentData: propertiesWithAgentData.length,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Error fixing agent data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
