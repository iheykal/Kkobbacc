import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, normalizePhoneNumber } from '@/lib/passwordUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug auth issue - starting investigation');
    await connectDB();
    
    const body = await request.json();
    const { phone, password } = body;
    
    console.log('🔍 Debug data:', { 
      phone, 
      password: password ? '***' : 'missing',
      passwordLength: password?.length 
    });
    
    if (!phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Phone and password required for debug'
      }, { status: 400 });
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('🔍 Normalized phone:', normalizedPhone);
    
    // Find user
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      console.log('❌ User not found for phone:', normalizedPhone);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          searchedPhone: normalizedPhone,
          originalPhone: phone
        }
      });
    }
    
    console.log('✅ User found:', {
      id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      hasPasswordHash: !!user.passwordHash,
      hasLegacyPassword: !!(user as any).password,
      passwordHashLength: user.passwordHash?.length,
      passwordHashStart: user.passwordHash?.substring(0, 20) + '...'
    });
    
    // Test password verification
    let passwordValid = false;
    let verificationError = null;
    
    try {
      if (user.passwordHash) {
        console.log('🔍 Testing password verification with hash...');
        passwordValid = await verifyPassword(user.passwordHash, password);
        console.log('🔍 Password verification result:', passwordValid);
      } else if ((user as any).password) {
        console.log('🔍 Testing legacy password...');
        const legacyPassword = (user as any).password;
        passwordValid = legacyPassword === password;
        console.log('🔍 Legacy password match:', passwordValid);
      } else {
        console.log('❌ No password hash or legacy password found');
        verificationError = 'No password found in user record';
      }
    } catch (error) {
      console.error('❌ Password verification error:', error);
      verificationError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Check all users with similar phone numbers
    const similarUsers = await User.find({
      phone: { $regex: phone.replace(/[^\d]/g, ''), $options: 'i' }
    }).select('_id fullName phone role passwordHash');
    
    console.log('🔍 Similar users found:', similarUsers.length);
    
    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          hasPasswordHash: !!user.passwordHash,
          hasLegacyPassword: !!(user as any).password,
          passwordHashLength: user.passwordHash?.length,
          passwordHashStart: user.passwordHash?.substring(0, 20) + '...'
        },
        passwordTest: {
          valid: passwordValid,
          error: verificationError,
          inputPassword: password?.substring(0, 3) + '...',
          inputLength: password?.length
        },
        phoneNormalization: {
          original: phone,
          normalized: normalizedPhone
        },
        similarUsers: similarUsers.map(u => ({
          id: u._id,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          hasPasswordHash: !!u.passwordHash
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
