import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 CLEANING UP ORPHANED PROPERTIES...');
    await connectDB();

    // Check if user is superadmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all active properties
    const properties = await Property.find({ deletionStatus: { $ne: 'deleted' } });
    console.log(`📊 Found ${properties.length} active properties`);

    // Get all existing users
    const users = await User.find({});
    const userIds = users.map(u => u._id.toString());
    console.log(`👥 Found ${users.length} users`);

    // Find orphaned properties
    const orphanedProperties = [];
    const validProperties = [];

    for (const property of properties) {
      if (property.agentId) {
        const agentIdStr = property.agentId.toString();
        if (userIds.includes(agentIdStr)) {
          validProperties.push(property);
        } else {
          orphanedProperties.push({
            _id: property._id,
            propertyId: property.propertyId,
            title: property.title,
            agentId: agentIdStr,
            agentName: property.agent?.name || 'Unknown',
            createdAt: property.createdAt
          });
        }
      } else {
        console.log(`⚠️ Property ${property.propertyId} has no agentId`);
        validProperties.push(property);
      }
    }

    console.log('\n📋 ANALYSIS RESULTS:');
    console.log(`✅ Properties with valid agents: ${validProperties.length}`);
    console.log(`❌ Orphaned properties: ${orphanedProperties.length}`);

    let deletedCount = 0;
    const deletedProperties = [];

    if (orphanedProperties.length > 0) {
      console.log('\n🚨 ORPHANED PROPERTIES FOUND:');
      orphanedProperties.forEach((prop, index) => {
        console.log(`${index + 1}. Property ${prop.propertyId}: "${prop.title}"`);
        console.log(`   Agent ID: ${prop.agentId} (DELETED)`);
        console.log(`   Agent Name: ${prop.agentName}`);
        console.log(`   Created: ${prop.createdAt}`);
        console.log('');
      });

      console.log('🗑️ DELETING ORPHANED PROPERTIES...');
      
      // Delete orphaned properties
      const orphanedIds = orphanedProperties.map(p => p._id);
      const deleteResult = await Property.deleteMany({ 
        _id: { $in: orphanedIds } 
      });

      deletedCount = deleteResult.deletedCount;
      deletedProperties.push(...orphanedProperties);

      console.log(`✅ Successfully deleted ${deletedCount} orphaned properties`);
    }

    // Final verification
    const remainingProperties = await Property.find({ deletionStatus: { $ne: 'deleted' } });
    const remainingUsers = await User.find({});
    const remainingUserIds = remainingUsers.map(u => u._id.toString());
    
    let stillOrphaned = 0;
    for (const property of remainingProperties) {
      if (property.agentId && !remainingUserIds.includes(property.agentId.toString())) {
        stillOrphaned++;
      }
    }

    console.log(`📊 Remaining active properties: ${remainingProperties.length}`);
    console.log(`👥 Remaining users: ${remainingUsers.length}`);
    console.log(`❌ Still orphaned: ${stillOrphaned}`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} orphaned properties.`,
      data: {
        deletedCount,
        deletedProperties: deletedProperties.map(p => ({
          propertyId: p.propertyId,
          title: p.title,
          agentId: p.agentId,
          agentName: p.agentName
        })),
        remainingProperties: remainingProperties.length,
        remainingUsers: remainingUsers.length,
        stillOrphaned,
        cleanedBy: currentUser.fullName,
        cleanedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup orphaned properties' },
      { status: 500 }
    );
  }
}


