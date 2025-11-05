import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const propertyId = params.id
    console.log('🗑️ Property deletion request for:', propertyId)
    
    // Check authentication from session cookie
    const cookie = request.cookies.get('kobac_session')?.value
    if (!cookie) {
      console.log('❌ No session cookie found')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    let session: { userId: string; role: string } | null = null
    try {
      session = JSON.parse(decodeURIComponent(cookie))
      console.log('📋 Session parsed:', session)
    } catch (error) {
      console.log('❌ Invalid session cookie:', error)
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }
    
    if (!session?.userId) {
      console.log('❌ No userId in session')
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
    }
    
    // Find the property
    const property = await Property.findById(propertyId)
    if (!property) {
      console.log('❌ Property not found:', propertyId)
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 })
    }
    
    // Check if the user is the owner of the property or a superadmin
    if (property.agentId.toString() !== session.userId && session.role !== 'superadmin') {
      console.log('❌ User not authorized to delete this property')
      return NextResponse.json({ success: false, error: 'Not authorized to delete this property' }, { status: 403 })
    }
    
    // Update the property deletion status
    property.deletionStatus = 'pending_deletion'
    property.deletionRequestedAt = new Date()
    property.deletionRequestedBy = session.userId
    
    await property.save()
    
    console.log('✅ Property deletion status updated:', {
      propertyId: property._id,
      deletionStatus: property.deletionStatus,
      deletionRequestedAt: property.deletionRequestedAt,
      deletionRequestedBy: property.deletionRequestedBy
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property deletion requested successfully',
      data: {
        id: property._id,
        deletionStatus: property.deletionStatus,
        deletionRequestedAt: property.deletionRequestedAt
      }
    })
    
  } catch (error) {
    console.error('💥 Error requesting property deletion:', error)
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    )
  }
}
