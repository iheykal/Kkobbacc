import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { normalizePhoneNumber } from '@/lib/passwordUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug password request received');
    await connectDB();
    
    const body = await request.json();
    const { phone, password } = body;
    
    console.log('📱 Debug attempt:', { phone, password: password ? '***' : 'missing' });
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Find user by phone number
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      console.log('❌ User not found:', normalizedPhone);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ User found:', user.fullName);
    console.log('🔍 Password hash info:', {
      hasPasswordHash: !!user.passwordHash,
      hashLength: user.passwordHash?.length,
      hashStart: user.passwordHash?.substring(0, 10),
      hasLegacyPassword: !!(user as any).password,
      legacyPassword: (user as any).password ? '***' : 'none'
    });
    
    // Try different verification methods
    const results = {
      bcryptjs: false,
      argon2: false,
      legacy: false
    };
    
    // Test bcryptjs
    try {
      const bcrypt = (await import('bcryptjs')).default;
      results.bcryptjs = await bcrypt.compare(password, user.passwordHash);
      console.log('🔐 Bcryptjs result:', results.bcryptjs);
    } catch (error) {
      console.log('🔐 Bcryptjs error:', error);
    }
    
    // Test argon2
    try {
      const argon2 = (await import('argon2')).default;
      results.argon2 = await argon2.verify(user.passwordHash, password);
      console.log('🔐 Argon2 result:', results.argon2);
    } catch (error) {
      console.log('🔐 Argon2 error:', error);
    }
    
    // Test legacy password
    if ((user as any).password) {
      results.legacy = (user as any).password === password;
      console.log('🔐 Legacy password result:', results.legacy);
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone
      },
      passwordInfo: {
        hasPasswordHash: !!user.passwordHash,
        hashLength: user.passwordHash?.length,
        hashStart: user.passwordHash?.substring(0, 10),
        hasLegacyPassword: !!(user as any).password
      },
      verificationResults: results
    });

  } catch (error) {
    console.error('❌ Debug password error:', error);
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
