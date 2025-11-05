import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const User = (await import('@/models/User')).default // Dynamic import for User model
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

    const propertyId = params.id

    // Find property by ID or propertyId
    const property = await Property.findOne({
      $or: [
        { _id: propertyId },
        { propertyId: parseInt(propertyId) }
      ]
    }).populate('agentId', 'fullName email')

    if (!property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 })
    }

    // Calculate expiration details
    const now = new Date()
    const expiresAt = new Date(property.expiresAt)
    const diff = expiresAt.getTime() - now.getTime()
    
    const isExpired = diff <= 0
    const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))
    const hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const secondsRemaining = Math.floor((diff % (1000 * 60)) / 1000)

    // Calculate days since created
    const createdAt = new Date(property.createdAt)
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Get expiration rule
    const expirationRule = property.listingType === 'rent' ? 30 : 90

    const expirationDetails = {
      property: {
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        location: property.location,
        district: property.district,
        listingType: property.listingType,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        status: property.status,
        createdAt: property.createdAt,
        expiresAt: property.expiresAt,
        agentName: (typeof property.agentId === 'object' ? property.agentId?.fullName : null) || property.agent?.name || 'Unknown Agent'
      },
      expiration: {
        isExpired,
        daysRemaining: isExpired ? 0 : daysRemaining,
        hoursRemaining: isExpired ? 0 : hoursRemaining,
        minutesRemaining: isExpired ? 0 : minutesRemaining,
        secondsRemaining: isExpired ? 0 : secondsRemaining,
        totalSecondsRemaining: isExpired ? 0 : Math.floor(diff / 1000),
        expirationRule,
        daysSinceCreated,
        status: isExpired ? 'expired' : 
               daysRemaining <= 1 ? 'critical' :
               daysRemaining <= 3 ? 'urgent' :
               daysRemaining <= 7 ? 'warning' : 'safe'
      }
    }

    return NextResponse.json({
      success: true,
      data: expirationDetails
    })

  } catch (error) {
    console.error('Error fetching property expiration details:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
