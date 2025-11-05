import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🕐 RUNNING SCHEDULED CLEANUP...');
    await connectDB();

    // Check if user is superadmin or if this is a scheduled job
    const authHeader = request.headers.get('authorization');
    const isScheduledJob = authHeader === `Bearer ${process.env.CLEANUP_JOB_TOKEN}`;
    
    if (!isScheduledJob) {
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
    }

    const now = new Date();
    console.log(`⏰ Scheduled cleanup started at: ${now.toISOString()}`);

    // 1. Find expired properties for complete removal
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' }
    });

    let removedCount = 0;
    let filesDeleted = 0;
    let filesFailed = 0;

    // 2. Complete removal of expired properties
    if (expiredProperties.length > 0) {
      console.log(`🗑️ Starting complete removal of ${expiredProperties.length} expired properties`);
      
      // Import R2 deletion utility
      const { deletePropertyFiles } = await import('@/lib/r2-delete');
      
      for (const property of expiredProperties) {
        try {
          // Delete files from R2
          const fileDeletionResult = await deletePropertyFiles({
            thumbnailImage: property.thumbnailImage,
            images: property.images
          });
          
          filesDeleted += fileDeletionResult.deleted;
          filesFailed += fileDeletionResult.failed;
          
          // Remove from database
          await Property.findByIdAndDelete(property._id);
          removedCount++;
          
          console.log(`✅ Completely removed property ${property.propertyId}`);
        } catch (error) {
          console.error(`❌ Failed to remove property ${property.propertyId}:`, error);
        }
      }
    }

    console.log(`✅ Completely removed ${removedCount} expired properties`);
    console.log(`📁 Files deleted from R2: ${filesDeleted}`);
    console.log(`❌ Files failed to delete: ${filesFailed}`);

    // 3. Get statistics (after removal)
    const totalProperties = await Property.countDocuments({ deletionStatus: { $ne: 'deleted' } });
    const expiredPropertiesCount = await Property.countDocuments({ 
      deletionStatus: { $ne: 'deleted' },
      isExpired: true 
    });
    const activeProperties = totalProperties - expiredPropertiesCount;

    // 4. Get properties expiring in the next 7 days
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const expiringSoonProperties = await Property.find({
      expiresAt: { $gte: now, $lte: sevenDaysFromNow },
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true }
    }).select('propertyId title location district listingType expiresAt agent.name')
      .sort({ expiresAt: 1 });

    const expiringSoonData = expiringSoonProperties.map(property => {
      const daysUntilExpiry = Math.ceil((property.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        location: property.location,
        district: property.district,
        listingType: property.listingType,
        expiresAt: property.expiresAt,
        agentName: property.agent?.name || 'Unknown',
        daysUntilExpiry
      };
    });

    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`Total active properties: ${activeProperties}`);
    console.log(`Total expired properties: ${expiredPropertiesCount}`);
    console.log(`Properties expiring soon: ${expiringSoonData.length}`);
    console.log(`Properties completely removed this run: ${removedCount}`);
    console.log(`Files deleted from R2: ${filesDeleted}`);
    console.log(`Files failed to delete: ${filesFailed}`);

    if (expiringSoonData.length > 0) {
      console.log('\n⚠️ PROPERTIES EXPIRING SOON:');
      expiringSoonData.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.title} (${prop.propertyId}) - ${prop.daysUntilExpiry} days left`);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled cleanup completed successfully',
      data: {
        timestamp: now.toISOString(),
        totalProperties,
        activeProperties,
        expiredProperties: expiredPropertiesCount,
        expiringSoonCount: expiringSoonData.length,
        removedCount,
        filesDeleted,
        filesFailed,
        updatedThisRun: removedCount,
        expiringSoon: expiringSoonData
      }
    });

  } catch (error) {
    console.error('❌ Error in scheduled cleanup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduled cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cleanup status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING CLEANUP STATUS...');
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
    
    // Get statistics
    const totalProperties = await Property.countDocuments({ deletionStatus: { $ne: 'deleted' } });
    const expiredProperties = await Property.countDocuments({ 
      deletionStatus: { $ne: 'deleted' },
      isExpired: true 
    });
    const activeProperties = totalProperties - expiredProperties;

    // Get properties expiring in the next 7 days
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const expiringSoonCount = await Property.countDocuments({
      expiresAt: { $gte: now, $lte: sevenDaysFromNow },
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true }
    });

    // Get properties that need to be marked as expired
    const needsExpirationUpdate = await Property.countDocuments({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        totalProperties,
        activeProperties,
        expiredProperties,
        expiringSoonCount,
        needsExpirationUpdate,
        cleanupNeeded: needsExpirationUpdate > 0
      }
    });

  } catch (error) {
    console.error('❌ Error checking cleanup status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check cleanup status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
