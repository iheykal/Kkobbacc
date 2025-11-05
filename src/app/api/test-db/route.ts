import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Get all properties
    const allProperties = await Property.find({})
    
    // Check district distribution
    const districtStats = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' },
          district: { $exists: true, $nin: [null, '', undefined] }
        }
      },
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Check property type distribution
    const propertyTypeStats = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' },
          propertyType: { $exists: true, $nin: [null, '', undefined] }
        }
      },
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

    // Check listing type distribution
    const listingTypeStats = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' },
          listingType: { $exists: true, $nin: [null, '', undefined] }
        }
      },
      {
        $group: {
          _id: '$listingType',
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
        districtStats,
        propertyTypeStats,
        listingTypeStats,
        sampleProperties: allProperties.slice(0, 5).map(p => ({
          id: p._id,
          district: p.district,
          propertyType: p.propertyType,
          listingType: p.listingType,
          status: p.status
        }))
      }
    })

  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
