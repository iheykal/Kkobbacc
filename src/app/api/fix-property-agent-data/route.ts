import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing property agent data...');
    
    // Connect to database
    await connectDB();
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone email avatar profile.avatar');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    console.log('👤 Found superadmin:', {
      id: superAdmin._id.toString(),
      name: superAdmin.fullName,
      phone: superAdmin.phone
    });
    
    // Find properties that need agent data fixing
    const properties = await Property.find({}).select('_id title agentId agent');
    
    console.log('📊 Found properties:', properties.length);
    
    let fixedCount = 0;
    const fixedProperties = [];
    
    for (const property of properties) {
      const propertyObj = property.toObject ? property.toObject() : property;
      let needsFix = false;
      let fixReason = '';
      
      // Check if agentId is missing or incorrect
      if (!propertyObj.agentId) {
        needsFix = true;
        fixReason = 'Missing agentId';
      } else if (typeof propertyObj.agentId === 'string' && propertyObj.agentId !== superAdmin._id.toString()) {
        needsFix = true;
        fixReason = 'Incorrect agentId';
      } else if (typeof propertyObj.agentId === 'object' && propertyObj.agentId && '_id' in propertyObj.agentId) {
        const agentIdObj = propertyObj.agentId as { _id: string };
        if (agentIdObj._id !== superAdmin._id.toString()) {
          needsFix = true;
          fixReason = 'Incorrect agentId object';
        }
      }
      
      if (needsFix) {
        console.log(`🔧 Fixing property ${propertyObj._id}: ${fixReason}`);
        
        // Update the property with correct agentId
        await Property.findByIdAndUpdate(propertyObj._id, {
          agentId: superAdmin._id
        });
        
        fixedCount++;
        fixedProperties.push({
          id: propertyObj._id,
          title: propertyObj.title,
          reason: fixReason,
          newAgentId: superAdmin._id.toString()
        });
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} properties`);
    
    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} properties with agent data`,
      superAdmin: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone
      },
      fixedProperties,
      summary: {
        totalProperties: properties.length,
        fixedCount,
        alreadyCorrect: properties.length - fixedCount
      }
    });
    
  } catch (error) {
    console.error('❌ Fix property agent data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking property agent data status...');
    
    // Connect to database
    await connectDB();
    
    // Find the superadmin user
    const superAdmin = await User.findOne({ role: 'superadmin' }).select('_id fullName phone');
    if (!superAdmin) {
      return NextResponse.json({
        success: false,
        error: "No superadmin user found in database"
      });
    }
    
    // Check properties
    const properties = await Property.find({}).select('_id title agentId');
    
    const correctCount = properties.filter(property => {
      const propertyObj = property.toObject ? property.toObject() : property;
      if (!propertyObj.agentId) return false;
      if (typeof propertyObj.agentId === 'string') {
        return propertyObj.agentId === superAdmin._id.toString();
      }
      if (typeof propertyObj.agentId === 'object' && propertyObj.agentId && '_id' in propertyObj.agentId) {
        const agentIdObj = propertyObj.agentId as { _id: string };
        return agentIdObj._id === superAdmin._id.toString();
      }
      return false;
    }).length;
    
    const needsFixCount = properties.length - correctCount;
    
    return NextResponse.json({
      success: true,
      superAdmin: {
        id: superAdmin._id.toString(),
        name: superAdmin.fullName,
        phone: superAdmin.phone
      },
      properties: {
        total: properties.length,
        correct: correctCount,
        needsFix: needsFixCount
      },
      status: {
        allCorrect: needsFixCount === 0,
        needsFix: needsFixCount > 0
      },
      action: {
        needed: needsFixCount > 0,
        description: needsFixCount > 0 ? 
          `${needsFixCount} properties need agent data fixing` :
          'All properties have correct agent data'
      }
    });
    
  } catch (error) {
    console.error('❌ Check property agent data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
