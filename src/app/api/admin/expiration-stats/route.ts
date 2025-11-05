import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 FETCHING EXPIRATION STATISTICS...');
    await connectDB();

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

    const User = (await import('@/models/User')).default
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

    const now = new Date();
    
    // Get comprehensive statistics
    const [
      totalProperties,
      activeProperties,
      expiredProperties,
      expiringSoonCount,
      needsExpirationUpdate,
      propertiesWithoutExpiration
    ] = await Promise.all([
      Property.countDocuments({ deletionStatus: { $ne: 'deleted' } }),
      Property.countDocuments({ 
        deletionStatus: { $ne: 'deleted' },
        isExpired: { $ne: true }
      }),
      Property.countDocuments({ 
        deletionStatus: { $ne: 'deleted' },
        isExpired: true 
      }),
      Property.countDocuments({
        expiresAt: { $gte: now, $lte: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)) },
        deletionStatus: { $ne: 'deleted' },
        isExpired: { $ne: true }
      }),
      Property.countDocuments({
        expiresAt: { $lt: now },
        deletionStatus: { $ne: 'deleted' },
        isExpired: { $ne: true }
      }),
      Property.countDocuments({
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null }
        ],
        deletionStatus: { $ne: 'deleted' }
      })
    ]);

    // Get properties by listing type
    const [rentalProperties, saleProperties] = await Promise.all([
      Property.countDocuments({ 
        listingType: 'rent',
        deletionStatus: { $ne: 'deleted' }
      }),
      Property.countDocuments({ 
        listingType: 'sale',
        deletionStatus: { $ne: 'deleted' }
      })
    ]);

    // Get recent activity (properties created in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentProperties = await Property.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      deletionStatus: { $ne: 'deleted' }
    });

    const stats = {
      timestamp: now.toISOString(),
      overview: {
        totalProperties,
        activeProperties,
        expiredProperties,
        expiringSoonCount,
        needsExpirationUpdate,
        propertiesWithoutExpiration
      },
      byType: {
        rentalProperties,
        saleProperties
      },
      activity: {
        recentProperties,
        period: '30 days'
      },
      alerts: {
        cleanupNeeded: needsExpirationUpdate > 0,
        migrationNeeded: propertiesWithoutExpiration > 0,
        expiringSoon: expiringSoonCount > 0
      }
    };

    console.log('📊 Expiration statistics:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching expiration statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch expiration statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
