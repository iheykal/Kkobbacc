import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole, UserStatus } from '@/models/User';
import { generateSuperAdminAvatar } from '@/lib/utils';
import { validatePassword } from '@/lib/passwordUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('👑 Creating SuperAdmin request received');
    await connectDB();
    
    const body = await request.json();
    const { fullName, phone, password, adminToken } = body;
    
    // Secure admin token validation - only allow from specific IPs or with valid token
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'kobac2025-secure-admin-token';
    const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1', 'localhost'];
    
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check if request is from allowed IP or has valid admin token
    const hasValidToken = adminToken === ADMIN_TOKEN;
    const isAllowedIP = ALLOWED_IPS.some(ip => clientIP.includes(ip.trim()));
    
    if (!hasValidToken && !isAllowedIP) {
      console.log('❌ Unauthorized SuperAdmin creation attempt from IP:', clientIP);
      return NextResponse.json(
        { success: false, error: 'Unauthorized access. Admin token required or IP not allowed.', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }
    
    // Validate required fields
    if (!fullName || !phone || !password) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fullName, phone, password', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }
    
    // Validate password using new rules (5+ chars, numbers or letters)
    const passwordError = validatePassword(password, phone);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError, code: 'INVALID_PASSWORD' },
        { status: 400 }
      );
    }
    
    // Validate phone number format (should start with +252 and have 9 digits after)
    if (!/^\+252\d{9}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number (9 digits after +252)', code: 'INVALID_PHONE' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      console.log('❌ Phone already in use:', phone);
      return NextResponse.json(
        { success: false, error: 'Phone already in use', code: 'PHONE_EXISTS' },
        { status: 409 }
      );
    }
    
    // Check if SuperAdmin already exists (consider both legacy and new role values)
    const existingSuperAdmin = await User.findOne({ role: { $in: [UserRole.SUPER_ADMIN, UserRole.SUPERADMIN] } });
    if (existingSuperAdmin) {
      console.log('❌ SuperAdmin already exists');
      return NextResponse.json(
        { success: false, error: 'SuperAdmin already exists', code: 'SUPERADMIN_EXISTS' },
        { status: 409 }
      );
    }
    
    console.log('✅ Creating SuperAdmin...');
    
    // Store password as plain text (no hashing)
    console.log('🔐 Storing SuperAdmin password as plain text');
    
    // Create SuperAdmin user
    const superAdmin = new User({
      fullName,
      phone,
      password, // Store as plain text
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        avatar: generateSuperAdminAvatar(phone, fullName),
        location: 'Somalia',
        occupation: 'System Administrator',
        company: 'Kobac Real Estate'
      },
      preferences: {
        favoriteProperties: [],
        searchHistory: [],
        notifications: {
          email: true,
          sms: true,
          push: true,
          propertyUpdates: true,
          marketNews: true,
          promotionalOffers: false
        },
        language: 'en',
        currency: 'USD',
        timezone: 'Africa/Mogadishu'
      },
      security: {
        loginAttempts: 0,
        twoFactorEnabled: false
      }
    });
    
    await superAdmin.save();
    console.log('✅ SuperAdmin created successfully:', superAdmin._id);
    
    // Return user data (without password)
    const userResponse = {
      id: superAdmin._id,
      fullName: superAdmin.fullName,
      phone: superAdmin.phone,
      role: superAdmin.role,
      status: superAdmin.status,
      permissions: superAdmin.permissions,
      createdAt: superAdmin.createdAt
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'SuperAdmin created successfully',
      data: userResponse
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error during SuperAdmin creation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SuperAdmin account', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
