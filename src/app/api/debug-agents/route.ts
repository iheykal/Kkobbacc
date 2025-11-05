import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🔍 Debug: Fetching all agents and properties...');
    
    // Get all users with agent/agency role
    const allUsers = await User.find({
      role: { $in: ['agent', 'agency'] }
    }).select('_id fullName firstName lastName phone email role status');
    
    // Get all properties with agent data
    const allProperties = await Property.find({}).select('propertyId agentId agent').limit(5);
    
    console.log('🔍 Debug results:', {
      totalUsers: allUsers.length,
      agentUsers: allUsers.filter(u => u.role === 'agent').length,
      agencyUsers: allUsers.filter(u => u.role === 'agency').length,
      sampleProperties: allProperties.length
    });
    
    return NextResponse.json({
      success: true,
      data: {
        users: allUsers.map(user => ({
          id: user._id.toString(),
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status
        })),
        sampleProperties: allProperties.map(prop => ({
          propertyId: prop.propertyId,
          agentId: prop.agentId,
          agent: prop.agent
        }))
      }
    });
    
  } catch (error) {
    console.error('Error in debug-agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
}
