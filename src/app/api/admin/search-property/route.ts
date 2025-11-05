import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'
import { getSessionFromRequest } from '@/lib/sessionUtils'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if user is superadmin (support both role formats)
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    console.log('Debug - User role:', user.role, 'User:', user.fullName, 'IsSuperAdmin:', isSuperAdmin)
    
    if (!isSuperAdmin) {
      console.log('Access denied. User role:', user.role, 'User:', user.fullName)
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint',
        debug: { userRole: user.role, userName: user.fullName, isSuperAdmin }
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 })
    }

    // Search by propertyId (numeric field) - exclude deleted properties
    const property = await Property.findOne({ 
      propertyId: parseInt(propertyId),
      deletionStatus: { $ne: 'deleted' }
    }).populate('agentId', 'firstName lastName email phone avatar licenseNumber fullName')

    // Increment view count when property is viewed by superadmin
    if (property) {
      await Property.findOneAndUpdate(
        { propertyId: parseInt(propertyId) },
        { $inc: { viewCount: 1 } }
      )
      // Update the property object to include the incremented view count
      property.viewCount = (property.viewCount || 0) + 1
    }

    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: `Property with ID ${propertyId} not found` 
      }, { status: 404 })
    }

    // Debug logging to check agent information
    console.log('🔍 Property found:', {
      propertyId: property.propertyId,
      title: property.title,
      agentId: property.agentId,
      agentObject: property.agent,
      createdAt: property.createdAt
    })

    return NextResponse.json({
      success: true,
      data: property
    })

  } catch (error) {
    console.error('Error searching property:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
