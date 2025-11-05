import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { normalizePhoneNumber } from '@/lib/passwordUtils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test debug endpoint accessed');
    await connectDB();
    
    // Find the user
    const normalizedPhone = '+252610251014';
    const user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        phone: normalizedPhone
      });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        hasPasswordHash: !!user.passwordHash,
        hashLength: user.passwordHash?.length,
        hashStart: user.passwordHash?.substring(0, 20),
        hasLegacyPassword: !!(user as any).password
      }
    });

  } catch (error) {
    console.error('❌ Test debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
