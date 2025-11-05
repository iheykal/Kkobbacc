import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function GET(request: NextRequest) {
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

    // Get all properties with their property types
    const allProperties = await Property.find({}).select('propertyId title propertyType').sort({ createdAt: -1 })

    // Get unique property types currently in database
    const currentPropertyTypes = Array.from(new Set(allProperties.map(p => p.propertyType)))

    // Find properties with invalid property types
    const invalidProperties = allProperties.filter(p => !validPropertyTypes.includes(p.propertyType))

    // Count by property type
    const propertyTypeCounts = await Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalProperties: allProperties.length,
        validPropertyTypes,
        currentPropertyTypes,
        invalidPropertyTypes: Array.from(new Set(invalidProperties.map(p => p.propertyType))),
        invalidPropertiesCount: invalidProperties.length,
        propertyTypeCounts,
        allProperties: allProperties.map(p => ({
          propertyId: p.propertyId,
          title: p.title,
          propertyType: p.propertyType,
          isValid: validPropertyTypes.includes(p.propertyType)
        }))
      }
    })

  } catch (error) {
    console.error('Error checking property types:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
