import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting agent image update for all properties...');
    await connectDB();

    // Check if user is SuperAdmin
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    const authResult = await authResponse.json();
    console.log('🔄 Update API auth check:', authResult);
    
    if (!authResponse.ok || (!authResult.user && !authResult.data)) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const currentUser = authResult.user || authResult.data;
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Get all properties
    const properties = await Property.find({}).lean();
    console.log(`📋 Found ${properties.length} properties to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        if (!property.agentId) {
          console.log(`⚠️ Property ${property._id} has no agentId, skipping`);
          continue;
        }

        // Get the agent's user profile
        const agent = await User.findById(property.agentId).select('fullName phone profile');
        
        if (!agent) {
          console.log(`⚠️ Agent ${property.agentId} not found for property ${property._id}`);
          continue;
        }

        // Update the property with agent's profile picture
        const updateData = {
          agent: {
            name: agent.fullName || 'Agent',
            phone: agent.phone || '+1234567890',
            image: agent.profile?.avatar || DEFAULT_AVATAR_URL,
            rating: property.agent?.rating || 0,
    
          }
        };

        await Property.findByIdAndUpdate(property._id, updateData);
        console.log(`✅ Updated property ${property._id} with agent ${agent.fullName}'s profile picture`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating property ${property._id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Agent image update complete: ${updatedCount} updated, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Agent images updated successfully`,
      data: {
        totalProperties: properties.length,
        updatedCount,
        errorCount
      }
    });

  } catch (error) {
    console.error('❌ Error updating agent images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent images' },
      { status: 500 }
    );
  }
}
