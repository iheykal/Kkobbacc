import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔄 Starting property agent data refresh...');
    
    // Get all properties
    const properties = await Property.find({ deletionStatus: { $ne: 'deleted' } });
    console.log(`📋 Found ${properties.length} properties to refresh`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each property
    for (const property of properties) {
      try {
        if (property.agentId) {
          // Get current agent data
          const agentUser = await User.findById(property.agentId);
          
          if (agentUser) {
            // Update the embedded agent data with current user data
            property.agent = {
              name: agentUser.fullName || `${agentUser.firstName || ''} ${agentUser.lastName || ''}`.trim() || 'Agent',
              phone: agentUser.phone || 'N/A',
              image: agentUser.avatar || '/icons/uze.png', // Use current avatar
              rating: 5.0
            };
            
            await property.save();
            updatedCount++;
            
            console.log(`✅ Updated property ${property.propertyId} with current agent data:`, {
              agentName: property.agent.name,
              agentAvatar: property.agent.image
            });
          } else {
            console.log(`⚠️ Agent user not found for property ${property.propertyId}`);
            errorCount++;
          }
        } else {
          console.log(`⚠️ Property ${property.propertyId} has no agentId`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating property ${property.propertyId}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎯 Property agent refresh completed: ${updatedCount} updated, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      message: `Property agent data refresh completed`,
      data: {
        totalProperties: properties.length,
        updatedCount,
        errorCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error in property agent refresh:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
