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
        debug: { userRole: user.role, userName: user.fullName, isSuperAdmin }
      }, { status: 403 })
    }

    // Get current status counts before fixing
    const beforeCounts = await Property.aggregate([
      {
        $group: {
          _id: '$deletionStatus',
          count: { $sum: 1 }
        }
      }
    ])

    // Fix properties that don't have deletionStatus or have null/undefined values
    const result = await Property.updateMany(
      { 
        $or: [
          { deletionStatus: { $exists: false } },
          { deletionStatus: null },
          { deletionStatus: undefined }
        ]
      },
      { $set: { deletionStatus: 'active' } }
    )

    // Get updated status counts
    const afterCounts = await Property.aggregate([
      {
        $group: {
          _id: '$deletionStatus',
          count: { $sum: 1 }
        }
      }
    ])

    // Get total properties count
    const totalProperties = await Property.countDocuments({})

    return NextResponse.json({
      success: true,
      data: {
        message: `Fixed ${result.modifiedCount} properties to have 'active' deletionStatus`,
        modifiedCount: result.modifiedCount,
        totalProperties,
        beforeCounts,
        afterCounts,
        summary: {
          propertiesFixed: result.modifiedCount,
          totalProperties,
          activeProperties: afterCounts.find((c: any) => c._id === 'active')?.count || 0,
          deletedProperties: afterCounts.find((c: any) => c._id === 'deleted')?.count || 0,
          pendingDeletionProperties: afterCounts.find((c: any) => c._id === 'pending_deletion')?.count || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fixing property status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
