import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Property from '@/models/Property'
import User from '@/models/User'
import { generateSessionId } from '@/lib/utils'
import { getAuthenticatedUser } from '@/lib/serverUtils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const propertyId = params.id

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'Property ID is required' }, { status: 400 })
    }

    // Get authenticated user if available
    const user = await getAuthenticatedUser(request);

    // Generate session ID for anonymous users
    const sessionId = user ? null : generateSessionId();

    // Try to find by propertyId first, then by _id if that fails - exclude deleted properties
    let property = await Property.findOne({
      propertyId: parseInt(propertyId),
      deletionStatus: { $ne: 'deleted' }
    });

    // If not found by propertyId, try by _id - exclude deleted properties
    if (!property) {
      property = await Property.findById(propertyId);
      // Additional check for deleted properties when searching by _id
      if (property && property.deletionStatus === 'deleted') {
        property = null;
      }
    }

    if (!property) {
      return NextResponse.json({
        success: false,
        error: `Property with ID ${propertyId} not found`
      }, { status: 404 })
    }

    // ANTI-INFLATION CHECKS
    let isUniqueView = false;
    let isOwnerView = false;
    let viewBlocked = false;
    let blockReason = '';

    // Check if the viewer is the property owner
    if (user && property.agentId && user._id.toString() === property.agentId.toString()) {
      isOwnerView = true;

      // Get current timestamp for rate limiting
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Check if owner has viewed this property recently (within 1 hour)
      // But allow the view to proceed - just don't count it as a unique view
      if (property.lastViewedAt && property.lastViewedAt > oneHourAgo) {
        // Don't block the view, just don't count it as unique
        console.log(`👤 Owner view detected for property ${property.propertyId} - not counting as unique view`);
      }
    }

    // Check for suspicious activity patterns
    if (user) {
      const userId = user._id.toString();

      // Check if user has viewed this property multiple times in a short period
      const recentViews = property.uniqueViewers?.filter((viewerId: any) =>
        viewerId.toString() === userId
      ).length || 0;

      if (recentViews > 5) {
        viewBlocked = true;
        blockReason = 'Excessive viewing detected';
      }
    }

    // If view is blocked, return without incrementing
    if (viewBlocked) {
      return NextResponse.json({
        success: false,
        error: blockReason,
        data: {
          propertyId: property.propertyId,
          viewCount: property.viewCount,
          uniqueViewCount: property.uniqueViewCount,
          isUniqueView: false,
          isOwnerView,
          viewBlocked: true
        }
      }, { status: 429 }) // Too Many Requests
    }

    const updateData: any = {
      $inc: { viewCount: 1 },
      lastViewedAt: new Date()
    };

    // Handle view counting based on user type
    if (user) {
      // Authenticated user
      const userId = user._id.toString();

      // Check if user already viewed this property
      const hasViewed = property.uniqueViewers?.some((viewerId: any) =>
        viewerId.toString() === userId
      );

      // Only count as unique view if not an owner view or if owner hasn't viewed recently
      if (!hasViewed && !isOwnerView) {
        isUniqueView = true;
        updateData.$inc.uniqueViewCount = 1;
        updateData.$addToSet = { uniqueViewers: user._id };
      }
    } else {
      // Anonymous user - use session ID
      if (sessionId && !property.anonymousViewers?.includes(sessionId)) {
        isUniqueView = true;
        updateData.$inc.uniqueViewCount = 1;
        updateData.$addToSet = { anonymousViewers: sessionId };
      }
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      property._id,
      updateData,
      { new: true }
    );

    if (!updatedProperty) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update property view count'
      }, { status: 500 });
    }

    // Update agent's total views (even if property gets deleted later, views are preserved)
    if (property.agentId) {
      try {
        await User.findByIdAndUpdate(
          property.agentId,
          {
            $inc: {
              'agentProfile.totalViews': 1
            }
          },
          { new: true }
        );
        console.log(`📊 Updated agent ${property.agentId} total views`);
      } catch (agentUpdateError) {
        console.error('Failed to update agent total views:', agentUpdateError);
        // Don't fail the view increment if agent update fails
      }
    }

    // Log view activity for monitoring
    console.log(`👁️ Property view: ${property.title} (ID: ${property.propertyId})`, {
      viewerType: user ? 'authenticated' : 'anonymous',
      isOwnerView,
      isUniqueView,
      viewCount: updatedProperty.viewCount,
      uniqueViewCount: updatedProperty.uniqueViewCount,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        propertyId: updatedProperty.propertyId,
        viewCount: updatedProperty.viewCount,
        uniqueViewCount: updatedProperty.uniqueViewCount,
        isUniqueView,
        isOwnerView,
        userType: user ? 'authenticated' : 'anonymous',
        viewBlocked: false
      }
    })

  } catch (error) {
    console.error('Error incrementing property view:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
