import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;

    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Only superadmin can access this endpoint'
      }, { status: 403 });
    }

    // Connect to database
    await connectDB();

    // Find properties with pending deletion status
    const pendingDeletions = await Property.find({
      deletionStatus: 'pending_deletion'
    }).populate('agentId', 'fullName email phone').select('_id propertyId title location district price listingType agentId agent deletionRequestedAt deletionRequestedBy createdAt');

    return NextResponse.json({
      success: true,
      data: pendingDeletions,
      count: pendingDeletions.length
    });

  } catch (error) {
    console.error('Error fetching pending deletions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending deletions' },
      { status: 500 }
    );
  }
}