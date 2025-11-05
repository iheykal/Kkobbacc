import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    console.log('🧹 Starting analytics reset...');
    
    // Connect to database
    await connectDB();
    
    // Session auth from cookie set on login
    const cookie = req.cookies.get('kobac_session')?.value;
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let session: { userId: string; role: string } | null = null;
    try {
      session = JSON.parse(decodeURIComponent(cookie));
    } catch (_) {}
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is superadmin
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      console.log('Access denied. User role:', user.role, 'User:', user.fullName);
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can reset analytics',
        debug: { userRole: user.role, userName: user.fullName }
      }, { status: 403 });
    }

    // Reset all analytics data for properties
    const propertyResetResult = await Property.updateMany(
      {},
      {
        $set: {
          viewCount: 0,
          uniqueViewCount: 0,
          uniqueViewers: [],
          anonymousViewers: [],
          lastViewedAt: new Date(),
          viewHistory: [],
          suspiciousActivity: {
            excessiveViews: 0,
            ownerViewCount: 0,
            lastOwnerView: null,
            flaggedAt: null,
            flagReason: null
          },
          viewQualityScore: 100,
          lastQualityCalculation: new Date()
        }
      }
    );

    console.log(`📊 Reset analytics for ${propertyResetResult.modifiedCount} properties`);

    // Reset agent total views
    const agentResetResult = await User.updateMany(
      { 'agentProfile.totalViews': { $exists: true } },
      {
        $set: {
          'agentProfile.totalViews': 0
        }
      }
    );

    console.log(`👥 Reset total views for ${agentResetResult.modifiedCount} agents`);

    // Get summary of reset
    const totalProperties = await Property.countDocuments({});
    const propertiesWithViews = await Property.countDocuments({ viewCount: { $gt: 0 } });
    const agentsWithViews = await User.countDocuments({ 'agentProfile.totalViews': { $gt: 0 } });

    console.log('✅ Analytics reset completed successfully');
    console.log(`📊 Total properties: ${totalProperties}`);
    console.log(`👀 Properties with views: ${propertiesWithViews}`);
    console.log(`👥 Agents with views: ${agentsWithViews}`);
    
    return NextResponse.json({
      success: true,
      message: 'Analytics reset completed successfully',
      data: {
        propertiesReset: propertyResetResult.modifiedCount,
        agentsReset: agentResetResult.modifiedCount,
        totalProperties,
        propertiesWithViews,
        agentsWithViews
      }
    });
    
  } catch (error) {
    console.error('❌ Error resetting analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Analytics reset endpoint. Use POST to reset all analytics data.',
    warning: 'This will clear all view counts, view history, and analytics data!'
  });
}
