import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { validatePassword, hashPassword, verifyResetToken } from '@/lib/passwordUtils';
import { setSessionCookie, createSessionPayload } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset confirmation received');
    await connectDB();
    
    const body = await request.json();
    const { userId, token, newPassword } = body;
    
    console.log('📱 Reset confirmation for user:', userId ? '***' : 'missing');
    
    // Validate required fields
    if (!userId || !token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID, token, and new password are required' },
        { status: 400 }
      );
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found for password reset:', userId);
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }
    
    // Check if reset token exists and is not expired
    if (!user.security.passwordResetTokenHash || !user.security.passwordResetExpires) {
      console.log('❌ No reset token found for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    if (user.security.passwordResetExpires < new Date()) {
      console.log('❌ Reset token expired for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      );
    }
    
    // Verify the reset token
    const isTokenValid = await verifyResetToken(user.security.passwordResetTokenHash, token);
    if (!isTokenValid) {
      console.log('❌ Invalid reset token for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword, user.phone);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 }
      );
    }
    
    console.log('✅ Valid reset token, updating password for user:', user.fullName);
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update user password and clear reset token
    user.passwordHash = newPasswordHash;
    user.passwordChangedAt = new Date();
    user.security.passwordResetTokenHash = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.mustChangePassword = false;
    user.security.loginAttempts = 0; // Reset login attempts
    
    await user.save();
    
    console.log('✅ Password updated successfully for user:', user.fullName);
    
    // Create new session and set cookie
    const sessionPayload = createSessionPayload(String(user._id), user.role);
    const response = NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You are now logged in.',
      data: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        avatar: user.profile?.avatar,
        createdAt: user.createdAt
      }
    });
    
    setSessionCookie(response, sessionPayload, process.env.NODE_ENV === 'production');
    
    return response;
    
  } catch (error) {
    console.error('Error during password reset confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}


