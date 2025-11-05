import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Property from '@/models/Property'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Agent ID is required' 
      }, { status: 400 })
    }

    // Get the agent user
    const agent = await User.findById(agentId)
    if (!agent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Agent not found' 
      }, { status: 404 })
    }

    // Get current properties views
    const currentPropertiesViews = await Property.aggregate([
      {
        $match: {
          agentId: agent._id,
          deletionStatus: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: { $ifNull: ['$viewCount', 0] } },
          totalUniqueViews: { $sum: { $ifNull: ['$uniqueViewCount', 0] } },
          propertyCount: { $sum: 1 }
        }
      }
    ])

    // Get deleted properties views (from agentProfile if available)
    const deletedPropertiesViews = agent.agentProfile?.deletedPropertiesViews || 0
    const totalViewsFromProfile = agent.agentProfile?.totalViews || 0

    // Calculate totals
    const currentViews = currentPropertiesViews[0]?.totalViews || 0
    const currentUniqueViews = currentPropertiesViews[0]?.totalUniqueViews || 0
    const currentPropertyCount = currentPropertiesViews[0]?.propertyCount || 0

    // The totalViews from profile should be the cumulative total
    // If it's not set, calculate from current properties
    const totalViews = totalViewsFromProfile > 0 ? totalViewsFromProfile : currentViews
    const totalUniqueViews = currentUniqueViews // Unique views are harder to track across deletions

    return NextResponse.json({
      success: true,
      data: {
        agentId: agent._id,
        agentName: agent.fullName,
        currentViews,
        currentUniqueViews,
        currentPropertyCount,
        deletedPropertiesViews,
        totalViews,
        totalUniqueViews,
        totalProperties: currentPropertyCount,
        // Historical data
        viewsFromProfile: totalViewsFromProfile,
        viewsFromCurrentProperties: currentViews
      }
    })

  } catch (error) {
    console.error('Error fetching agent total views:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
