import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { normalizePhoneNumber } from '@/lib/passwordUtils';
import { setSessionCookie, createSessionPayload } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Force password reset request received');
    await connectDB();
    
    const body = await request.json();
    const { phone, newPassword } = body;
    
    console.log('📱 Force reset attempt:', { phone, newPassword: newPassword ? '***' : 'missing' });
    
    // Validate required fields
    if (!phone || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: phone, newPassword' },
        { status: 400 }
      );
    }
    
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
    
    // Store new password as plain text (no hashing)
    console.log('🔐 Storing new password as plain text');
    
    // Update user with new plain password
    (user as any).password = newPassword;
    user.passwordChangedAt = new Date();
    user.security.loginAttempts = 0; // Reset login attempts
    user.security.mustChangePassword = false;
    
    await user.save();
    console.log('✅ Password updated successfully');
    
    // Create session and set cookie
    const sessionPayload = createSessionPayload(String(user._id), user.role);
    const response = NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatar: user.profile?.avatar
      }
    });
    
    setSessionCookie(response, sessionPayload);
    
    return response;

  } catch (error) {
    console.error('❌ Force password reset error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Password reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
