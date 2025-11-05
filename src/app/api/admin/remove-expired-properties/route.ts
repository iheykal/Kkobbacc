import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { deletePropertyFiles } from '@/lib/r2-delete';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ COMPLETELY REMOVING EXPIRED PROPERTIES...');
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
    console.log(`⏰ Current time: ${now.toISOString()}`);

    // Find expired properties that are still in database
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' }
    });

    console.log(`📊 Found ${expiredProperties.length} expired properties to completely remove`);

    if (expiredProperties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired properties found to remove',
        data: {
          removedCount: 0,
          filesDeleted: 0,
          filesFailed: 0,
          removedProperties: []
        }
      });
    }

    const removalResults = {
      removedCount: 0,
      filesDeleted: 0,
      filesFailed: 0,
      removedProperties: [] as any[],
      errors: [] as string[]
    };

    // Process each expired property
    for (const property of expiredProperties) {
      try {
        console.log(`\n🗑️ Removing property: ${property.title} (ID: ${property.propertyId})`);
        
        // 1. Delete all associated files from R2
        const fileDeletionResult = await deletePropertyFiles({
          thumbnailImage: property.thumbnailImage,
          images: property.images
        });

        console.log(`📁 File deletion result:`, {
          deleted: fileDeletionResult.deleted,
          failed: fileDeletionResult.failed,
          errors: fileDeletionResult.errors
        });

        removalResults.filesDeleted += fileDeletionResult.deleted;
        removalResults.filesFailed += fileDeletionResult.failed;
        removalResults.errors.push(...fileDeletionResult.errors);

        // 2. Remove property from database
        await Property.findByIdAndDelete(property._id);
        
        console.log(`✅ Property ${property.propertyId} completely removed from database`);

        // 3. Record removal
        removalResults.removedCount++;
        removalResults.removedProperties.push({
          _id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          location: property.location,
          district: property.district,
          listingType: property.listingType,
          expiresAt: property.expiresAt,
          createdAt: property.createdAt,
          agentName: property.agent?.name || 'Unknown',
          filesDeleted: fileDeletionResult.deleted,
          filesFailed: fileDeletionResult.failed
        });

      } catch (error) {
        console.error(`❌ Failed to remove property ${property.propertyId}:`, error);
        removalResults.errors.push(`Failed to remove property ${property.propertyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('\n📋 COMPLETE REMOVAL SUMMARY:');
    console.log(`✅ Properties removed from database: ${removalResults.removedCount}`);
    console.log(`📁 Files deleted from R2: ${removalResults.filesDeleted}`);
    console.log(`❌ Files failed to delete: ${removalResults.filesFailed}`);
    console.log(`⚠️ Total errors: ${removalResults.errors.length}`);

    if (removalResults.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      removalResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${removalResults.removedCount} expired properties completely`,
      data: {
        removedCount: removalResults.removedCount,
        filesDeleted: removalResults.filesDeleted,
        filesFailed: removalResults.filesFailed,
        totalErrors: removalResults.errors.length,
        removedProperties: removalResults.removedProperties,
        errors: removalResults.errors
      }
    });

  } catch (error) {
    console.error('❌ Error in complete removal process:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during complete removal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Check if user is superadmin
    const isSuperAdmin = user.role === 'superadmin' || user.role === 'super_admin' || user.role === 'SUPERADMIN' || user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint'
      }, { status: 403 })
    }

    const now = new Date();

    // Get expired properties that can be completely removed
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' }
    }).select('propertyId title location district listingType expiresAt createdAt agent.name thumbnailImage images');

    const expiredPropertiesData = expiredProperties.map(property => {
      const daysExpired = Math.floor((now.getTime() - property.expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      const totalFiles = (property.thumbnailImage ? 1 : 0) + (property.images?.length || 0);
      
      return {
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        location: property.location,
        district: property.district,
        listingType: property.listingType,
        expiresAt: property.expiresAt,
        createdAt: property.createdAt,
        agentName: property.agent?.name || 'Unknown',
        daysExpired,
        totalFiles,
        thumbnailImage: property.thumbnailImage,
        images: property.images
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: expiredProperties.length,
        expiredProperties: expiredPropertiesData,
        totalFilesToDelete: expiredPropertiesData.reduce((sum, prop) => sum + prop.totalFiles, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching expired properties for removal:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
