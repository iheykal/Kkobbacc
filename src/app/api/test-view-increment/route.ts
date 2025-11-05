import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get a sample property to test with
    const sampleProperty = await Property.findOne({}).select('propertyId _id title viewCount')
    
    if (!sampleProperty) {
      return NextResponse.json({
        success: false,
        error: 'No properties found to test with'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        sampleProperty: {
          propertyId: sampleProperty.propertyId,
          _id: sampleProperty._id,
          title: sampleProperty.title,
          viewCount: sampleProperty.viewCount || 0
        },
        message: 'Use this propertyId to test view increment'
      }
    })

  } catch (error) {
    console.error('Error in test view increment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 })
    }

    console.log('Testing view increment for propertyId:', propertyId)

    // Try to find by propertyId first
    let property = await Property.findOne({ propertyId: parseInt(propertyId) }).select('propertyId _id title viewCount')
    
    if (!property) {
      // Try by _id
      property = await Property.findById(propertyId).select('propertyId _id title viewCount')
    }

    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: `Property with ID ${propertyId} not found` 
      }, { status: 404 })
    }

    console.log('Found property before increment:', {
      propertyId: property.propertyId,
      _id: property._id,
      title: property.title,
      viewCount: property.viewCount || 0
    })

    // Try to increment view count
    const updatedProperty = await Property.findOneAndUpdate(
      { propertyId: parseInt(propertyId) },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).select('propertyId _id title viewCount')

    if (!updatedProperty) {
      // Try by _id
      const updatedPropertyById = await Property.findByIdAndUpdate(
        propertyId,
        { $inc: { viewCount: 1 } },
        { new: true }
      ).select('propertyId _id title viewCount')

      if (!updatedPropertyById) {
        return NextResponse.json({ 
          success: false, 
          error: `Failed to update property with ID ${propertyId}` 
        }, { status: 500 })
      }

      console.log('Updated property by _id:', {
        propertyId: updatedPropertyById.propertyId,
        _id: updatedPropertyById._id,
        title: updatedPropertyById.title,
        viewCount: updatedPropertyById.viewCount
      })

      return NextResponse.json({
        success: true,
        data: {
          propertyId: updatedPropertyById.propertyId,
          viewCount: updatedPropertyById.viewCount,
          method: 'updated_by_id'
        }
      })
    }

    console.log('Updated property by propertyId:', {
      propertyId: updatedProperty.propertyId,
      _id: updatedProperty._id,
      title: updatedProperty.title,
      viewCount: updatedProperty.viewCount
    })

    return NextResponse.json({
      success: true,
      data: {
        propertyId: updatedProperty.propertyId,
        viewCount: updatedProperty.viewCount,
        method: 'updated_by_propertyId'
      }
    })

  } catch (error) {
    console.error('Error testing view increment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
