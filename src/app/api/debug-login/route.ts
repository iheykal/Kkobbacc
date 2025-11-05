import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, normalizePhoneNumber, validatePhoneNumber } from '@/lib/passwordUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug login request received');
    await connectDB();
    
    const body = await request.json();
    const { phone, password } = body;
    
    console.log('📱 Debug login attempt:', { phone, password: password ? '***' : 'missing' });
    
    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: phone, password',
        debug: {
          hasPhone: !!phone,
          hasPassword: !!password
        }
      }, { status: 400 });
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('📞 Phone normalization:', { original: phone, normalized: normalizedPhone });
    
    // Validate phone number format
    const isValidPhone = validatePhoneNumber(normalizedPhone);
    console.log('📞 Phone validation:', { isValid: isValidPhone });
    
    if (!isValidPhone) {
      return NextResponse.json({
        success: false,
        error: 'Invalid phone number format',
        debug: {
          originalPhone: phone,
          normalizedPhone: normalizedPhone,
          isValid: false
        }
      }, { status: 400 });
    }
    
    // Find user by phone number
    const user = await User.findOne({ phone: normalizedPhone });
    console.log('👤 User lookup:', { 
      found: !!user, 
      userId: user?._id,
      fullName: user?.fullName,
      hasPasswordHash: !!user?.passwordHash,
      hasOldPassword: !!(user as any)?.password
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: {
          normalizedPhone: normalizedPhone,
          userFound: false
        }
      }, { status: 401 });
    }
    
    // Check if user has old plain-text password (migration needed)
    if (!user.passwordHash && (user as any).password) {
      const oldPassword = (user as any).password;
      const isLegacyPasswordMatch = oldPassword === password;
      
      return NextResponse.json({
        success: false,
        error: isLegacyPasswordMatch ? 'Password reset required' : 'Invalid password',
        code: isLegacyPasswordMatch ? 'PASSWORD_RESET_REQUIRED' : 'INVALID_PASSWORD',
        debug: {
          hasPasswordHash: false,
          hasOldPassword: true,
          needsMigration: true,
          legacyPasswordMatch: isLegacyPasswordMatch,
          oldPasswordType: typeof oldPassword,
          oldPasswordLength: oldPassword?.length
        }
      }, { status: 401 });
    }
    
    // Verify password using constant-time comparison
    console.log('🔐 Starting password verification...');
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    console.log('🔐 Password verification result:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        debug: {
          passwordHashExists: !!user.passwordHash,
          passwordHashLength: user.passwordHash?.length,
          verificationResult: false
        }
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login would be successful',
      debug: {
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status
        },
        phoneNormalization: {
          original: phone,
          normalized: normalizedPhone,
          isValid: true
        },
        passwordVerification: {
          hasHash: !!user.passwordHash,
          isValid: true
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Debug login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
