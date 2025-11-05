import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { validatePhoneNumber, normalizePhoneNumber, generateResetToken, hashResetToken } from '@/lib/passwordUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset request received');
    await connectDB();
    
    const body = await request.json();
    const { phone } = body;
    
    console.log('📱 Reset request for phone:', phone ? '***' : 'missing');
    
    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Validate phone number format
    if (!validatePhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number (9 digits, e.g., 61xxxxxxx)' },
        { status: 400 }
      );
    }
    
    // Find user by phone number
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      // Don't reveal if user exists or not for security
      console.log('❌ Password reset requested for non-existent user:', normalizedPhone);
      return NextResponse.json({
        success: true,
        message: 'If an account with this phone number exists, a reset link has been sent.'
      });
    }
    
    console.log('✅ User found for password reset:', user.fullName);
    
    // Generate reset token
    const resetToken = await generateResetToken();
    const tokenHash = await hashResetToken(resetToken);
    
    // Set token and expiration (15 minutes)
    user.security.passwordResetTokenHash = tokenHash;
    user.security.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await user.save();
    
    console.log('✅ Reset token generated for user:', user.fullName);
    
    // In a real application, you would send the token via SMS or email
    // For now, we'll return it in the response for testing purposes
    // TODO: Implement SMS/email sending
    console.log('🔑 Reset token (for testing):', resetToken);
    
    return NextResponse.json({
      success: true,
      message: 'Password reset token has been generated. Please check your phone for the reset link.',
      // Remove this in production - only for testing
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      userId: user._id
    });
    
  } catch (error) {
    console.error('Error during password reset request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}


