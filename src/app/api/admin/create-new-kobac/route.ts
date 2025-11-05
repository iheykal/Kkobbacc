import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole, UserStatus } from '@/models/User';
import { generateSuperAdminAvatar } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('👑 Creating new Kobac user...');
    await connectDB();
    
    // Check if any SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ 
      role: { $in: [UserRole.SUPER_ADMIN, UserRole.SUPERADMIN] } 
    });
    
    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SuperAdmin already exists. Please delete the existing one first.',
          existingSuperAdmin: {
            id: existingSuperAdmin._id,
            fullName: existingSuperAdmin.fullName,
            phone: existingSuperAdmin.phone
          }
        },
        { status: 409 }
      );
    }
    
    // Create new Kobac user with plain password
    const newKobac = new User({
      fullName: "Kobac Real Estate",
      phone: "+252610251014",
      password: "8080kobac", // Plain text password
      role: UserRole.SUPERADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        avatar: generateSuperAdminAvatar("+252610251014", "Kobac Real Estate"),
        location: "Somalia",
        occupation: "System Administrator",
        company: "Kobac Real Estate"
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
        language: "en",
        currency: "USD",
        timezone: "Africa/Mogadishu"
      },
      security: {
        loginAttempts: 0,
        twoFactorEnabled: false,
        mustChangePassword: false
      },
      passwordChangedAt: new Date()
    });
    
    await newKobac.save();
    console.log('✅ New Kobac user created successfully:', newKobac._id);
    
    return NextResponse.json({
      success: true,
      message: 'New Kobac user created successfully',
      data: {
        id: newKobac._id,
        fullName: newKobac.fullName,
        phone: newKobac.phone,
        role: newKobac.role,
        status: newKobac.status,
        hasPassword: !!(newKobac as any).password,
        hasPasswordHash: !!newKobac.passwordHash,
        createdAt: newKobac.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating new Kobac user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create new Kobac user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
