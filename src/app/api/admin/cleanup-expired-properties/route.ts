import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 CLEANING UP EXPIRED PROPERTIES...');
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

    // Find expired properties that are still active
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' },
      isExpired: { $ne: true } // Only get properties that haven't been marked as expired yet
    });

    console.log(`📊 Found ${expiredProperties.length} expired properties`);

    if (expiredProperties.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired properties found',
        data: {
          expiredCount: 0,
          processedCount: 0,
          expiredProperties: []
        }
      });
    }

    // Update expired properties
    const expiredPropertyIds = expiredProperties.map(p => p._id);
    const updateResult = await Property.updateMany(
      { _id: { $in: expiredPropertyIds } },
      { 
        $set: { 
          isExpired: true,
          status: 'Off Market',
          updatedAt: now
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} expired properties`);

    // Get updated properties for response
    const updatedProperties = await Property.find({
      _id: { $in: expiredPropertyIds }
    }).select('propertyId title location district listingType expiresAt createdAt agent.name');

    const expiredPropertiesData = updatedProperties.map(property => ({
      _id: property._id,
      propertyId: property.propertyId,
      title: property.title,
      location: property.location,
      district: property.district,
      listingType: property.listingType,
      expiresAt: property.expiresAt,
      createdAt: property.createdAt,
      agentName: property.agent?.name || 'Unknown'
    }));

    console.log('\n📋 EXPIRED PROPERTIES PROCESSED:');
    expiredPropertiesData.forEach((prop, index) => {
      const daysExpired = Math.floor((now.getTime() - prop.expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${index + 1}. ${prop.title} (${prop.propertyId})`);
      console.log(`   Location: ${prop.location}, ${prop.district}`);
      console.log(`   Type: ${prop.listingType} | Expired: ${daysExpired} days ago`);
      console.log(`   Agent: ${prop.agentName}`);
      console.log('');
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${updateResult.modifiedCount} expired properties`,
      data: {
        expiredCount: expiredProperties.length,
        processedCount: updateResult.modifiedCount,
        expiredProperties: expiredPropertiesData
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up expired properties:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup expired properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check expired properties without processing them
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 CHECKING EXPIRED PROPERTIES...');
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
    
    // Find expired properties
    const expiredProperties = await Property.find({
      expiresAt: { $lt: now },
      deletionStatus: { $ne: 'deleted' }
    }).select('propertyId title location district listingType expiresAt createdAt agent.name isExpired')
      .sort({ expiresAt: 1 });

    const expiredPropertiesData = expiredProperties.map(property => {
      const daysExpired = Math.floor((now.getTime() - property.expiresAt.getTime()) / (1000 * 60 * 60 * 24));
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
        isExpired: property.isExpired
      };
    });

    // Group by expiration status
    const notMarkedExpired = expiredPropertiesData.filter(p => !p.isExpired);
    const alreadyMarkedExpired = expiredPropertiesData.filter(p => p.isExpired);

    return NextResponse.json({
      success: true,
      data: {
        totalExpired: expiredProperties.length,
        notMarkedExpired: notMarkedExpired.length,
        alreadyMarkedExpired: alreadyMarkedExpired.length,
        expiredProperties: expiredPropertiesData
      }
    });

  } catch (error) {
    console.error('❌ Error checking expired properties:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check expired properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
