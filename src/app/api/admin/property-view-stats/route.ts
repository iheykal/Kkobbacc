import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'
import { getSessionFromRequest } from '@/lib/sessionUtils'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get session using standard session utilities
    const session = getSessionFromRequest(request)
    if (!session) {
      console.log('Property view stats: No session found')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(session.userId)
    if (!user) {
      console.log('Property view stats: User not found for session:', session.userId)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin (support both role formats)
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      console.log('Property view stats: Access denied. User role:', user.role, 'User:', user.fullName)
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint',
        debug: { userRole: user.role, userName: user.fullName }
      }, { status: 403 })
    }

    console.log('Property view stats: Access granted for superadmin:', user.fullName)

    // First, let's test if we can query the database at all
    console.log('Property view stats: Testing database connection...')
    const totalPropertiesCount = await Property.countDocuments({})
    console.log('Property view stats: Total properties in database:', totalPropertiesCount)

    if (totalPropertiesCount === 0) {
      console.log('Property view stats: No properties found in database')
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalViews: 0,
            totalProperties: 0,
            avgViews: 0,
            propertiesWithNoViews: 0
          },
          mostViewedProperties: []
        }
      })
    }

    // Get total view count and most viewed properties
    console.log('Property view stats: Fetching aggregate data...')
    const totalViews = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' } // Only count active properties
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          totalProperties: { $sum: 1 },
          avgViews: { $avg: '$viewCount' }
        }
      }
    ])

    // Get most viewed properties
    console.log('Property view stats: Fetching most viewed properties...')
    const mostViewedProperties = await Property.find({
      deletionStatus: { $ne: 'deleted' }
    })
    .sort({ viewCount: -1 })
    .limit(10)
    .select('propertyId title location district price viewCount propertyType listingType')

    // Get properties with no views
    console.log('Property view stats: Counting properties with no views...')
    const propertiesWithNoViews = await Property.countDocuments({
      deletionStatus: { $ne: 'deleted' },
      viewCount: 0
    })

    const stats = totalViews[0] || { totalViews: 0, totalProperties: 0, avgViews: 0 }
    
    console.log('Property view stats: Data fetched successfully:', {
      totalViews: stats.totalViews,
      totalProperties: stats.totalProperties,
      avgViews: stats.avgViews,
      propertiesWithNoViews,
      mostViewedCount: mostViewedProperties.length
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalViews: stats.totalViews,
          totalProperties: stats.totalProperties,
          avgViews: Math.round(stats.avgViews),
          propertiesWithNoViews
        },
        mostViewedProperties: mostViewedProperties.map(prop => ({
          propertyId: prop.propertyId,
          title: prop.title,
          location: prop.location,
          district: prop.district,
          price: prop.price,
          viewCount: prop.viewCount,
          propertyType: prop.propertyType,
          listingType: prop.listingType
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching property view stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
