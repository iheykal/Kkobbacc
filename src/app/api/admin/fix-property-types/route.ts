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
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user is superadmin
    if (user.role !== 'superadmin' && user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Access denied. Only superadmin can perform this action.' }, { status: 403 })
    }

    // Valid property types from the enum
    const validPropertyTypes = [
      'villa',
      'bacweyne', 
      'apartment',
      'condo',
      'townhouse',
      'luxury',
      'penthouse',
      'mansion',
      'estate'
    ]

    // Find properties with invalid property types
    const invalidProperties = await Property.find({
      propertyType: { $nin: validPropertyTypes }
    })

    // Update invalid properties to use 'villa' as default
    const result = await Property.updateMany(
      {
        propertyType: { $nin: validPropertyTypes }
      },
      { $set: { propertyType: 'villa' } }
    )

    return NextResponse.json({
      success: true,
      data: {
        message: `Fixed ${result.modifiedCount} properties with invalid property types`,
        modifiedCount: result.modifiedCount,
        invalidPropertiesFound: invalidProperties.length,
        invalidPropertyTypes: Array.from(new Set(invalidProperties.map(p => p.propertyType))),
        validPropertyTypes
      }
    })

  } catch (error) {
    console.error('Error fixing property types:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
