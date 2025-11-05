import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import { getAuthenticatedUser } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const propertyId = params.id

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 })
    }

    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Try to find by propertyId first, then by _id if that fails
    let property = await Property.findOne({ propertyId: parseInt(propertyId) });
    
    // If not found by propertyId, try by _id
    if (!property) {
      property = await Property.findById(propertyId);
    }

    if (!property) {
      return NextResponse.json({ 
        success: false, 
        error: `Property with ID ${propertyId} not found` 
      }, { status: 404 })
    }

    // Only allow property owner or superadmin to view analytics
    if (property.agentId && property.agentId.toString() !== user._id.toString() && user.role !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: You can only view analytics for your own properties' 
      }, { status: 403 })
    }

    // Calculate view statistics
    const totalViews = property.viewCount || 0;
    const uniqueViews = property.uniqueViewCount || 0;
    const uniqueViewers = property.uniqueViewers?.length || 0;
    const anonymousViewers = property.anonymousViewers?.length || 0;
    
    // Calculate view quality score (unique views / total views)
    const viewQualityScore = totalViews > 0 ? (uniqueViews / totalViews) * 100 : 0;

    // Check for owner views
    const ownerViews = property.uniqueViewers?.some((viewerId: any) => 
      viewerId.toString() === user._id.toString()
    ) ? 1 : 0;

    // Calculate engagement metrics
    const engagementRate = uniqueViewers > 0 ? (uniqueViews / uniqueViewers) : 0;
    
    // Determine view quality status
    let viewQualityStatus = 'Excellent';
    if (viewQualityScore < 30) viewQualityStatus = 'Poor';
    else if (viewQualityScore < 50) viewQualityStatus = 'Fair';
    else if (viewQualityScore < 70) viewQualityStatus = 'Good';
    else if (viewQualityScore < 90) viewQualityStatus = 'Very Good';

    const analytics = {
      propertyId: property.propertyId,
      title: property.title,
      totalViews,
      uniqueViews,
      uniqueViewers,
      anonymousViewers,
      viewQualityScore: Math.round(viewQualityScore * 100) / 100, // Round to 2 decimal places
      viewQualityStatus,
      engagementRate: Math.round(engagementRate * 100) / 100,
      lastViewedAt: property.lastViewedAt,
      createdAt: property.createdAt,
      // Anti-inflation metrics
      ownerViews,
      suspiciousActivity: viewQualityScore < 50 ? 'Low view quality detected' : 'Normal',
      recommendations: [] as string[],
      viewsPerDay: 0,
      daysSinceCreation: 0
    };

    // Add recommendations based on analytics
    if (viewQualityScore < 50) {
      analytics.recommendations.push('Consider improving property presentation to increase genuine interest');
    }
    if (uniqueViews < 10) {
      analytics.recommendations.push('Property may need more exposure through marketing');
    }
    if (totalViews > 0 && uniqueViews === 0) {
      analytics.recommendations.push('All views are from the same user - consider broader marketing');
    }
    if (ownerViews > 0) {
      analytics.recommendations.push('Owner views detected - ensure you\'re not inflating your own views');
    }
    if (engagementRate < 1.5) {
      analytics.recommendations.push('Low engagement rate - consider improving property description and photos');
    }

    // Add performance insights
    const daysSinceCreation = Math.ceil((new Date().getTime() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const viewsPerDay = daysSinceCreation > 0 ? (uniqueViews / daysSinceCreation) : 0;
    
    analytics.viewsPerDay = Math.round(viewsPerDay * 100) / 100;
    analytics.daysSinceCreation = daysSinceCreation;

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Error fetching view analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
