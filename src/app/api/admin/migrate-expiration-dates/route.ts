import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 MIGRATING EXPIRATION DATES FOR EXISTING PROPERTIES...');
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

    // Find properties without expiration dates
    const propertiesWithoutExpiration = await Property.find({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null }
      ],
      deletionStatus: { $ne: 'deleted' }
    });

    console.log(`📊 Found ${propertiesWithoutExpiration.length} properties without expiration dates`);

    if (propertiesWithoutExpiration.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All properties already have expiration dates',
        data: {
          processedCount: 0,
          properties: []
        }
      });
    }

    const now = new Date();
    const updatedProperties = [];

    // Update each property with appropriate expiration date
    for (const property of propertiesWithoutExpiration) {
      let expirationDate: Date;
      
      if (property.listingType === 'rent') {
        // For rentals, set expiration to 30 days from creation date
        expirationDate = new Date(property.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000));
      } else {
        // For sales, set expiration to 90 days from creation date
        expirationDate = new Date(property.createdAt.getTime() + (90 * 24 * 60 * 60 * 1000));
      }

      // Check if property is already expired
      const isExpired = now > expirationDate;

      await Property.updateOne(
        { _id: property._id },
        {
          $set: {
            expiresAt: expirationDate,
            isExpired: isExpired,
            // If expired, also update status to 'Off Market'
            ...(isExpired && { status: 'Off Market' })
          }
        }
      );

      updatedProperties.push({
        _id: property._id,
        propertyId: property.propertyId,
        title: property.title,
        listingType: property.listingType,
        createdAt: property.createdAt,
        expiresAt: expirationDate,
        isExpired: isExpired,
        daysUntilExpiry: isExpired ? 0 : Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      });
    }

    console.log(`✅ Updated ${updatedProperties.length} properties with expiration dates`);

    // Count expired properties
    const expiredCount = updatedProperties.filter(p => p.isExpired).length;
    const activeCount = updatedProperties.length - expiredCount;

    console.log('\n📋 MIGRATION SUMMARY:');
    console.log(`Total properties processed: ${updatedProperties.length}`);
    console.log(`Active properties: ${activeCount}`);
    console.log(`Expired properties: ${expiredCount}`);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updatedProperties.length} properties with expiration dates`,
      data: {
        processedCount: updatedProperties.length,
        activeCount,
        expiredCount,
        properties: updatedProperties
      }
    });

  } catch (error) {
    console.error('❌ Error migrating expiration dates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to migrate expiration dates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which properties need migration
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING PROPERTIES THAT NEED EXPIRATION DATE MIGRATION...');
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

    // Find properties without expiration dates
    const propertiesWithoutExpiration = await Property.find({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null }
      ],
      deletionStatus: { $ne: 'deleted' }
    }).select('propertyId title location district listingType createdAt status agent.name')
      .sort({ createdAt: -1 });

    const propertiesData = propertiesWithoutExpiration.map(property => ({
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      location: property.location,
      district: property.district,
      listingType: property.listingType,
      createdAt: property.createdAt,
      status: property.status,
      agentName: property.agent?.name || 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalNeedingMigration: propertiesWithoutExpiration.length,
        properties: propertiesData
      }
    });

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
