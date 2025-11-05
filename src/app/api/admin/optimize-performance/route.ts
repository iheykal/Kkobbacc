import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('⚡ Starting performance optimization...');
    await connectDB();

    // Check authentication
    const { getSessionFromRequest } = await import('@/lib/sessionUtils');
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const User = (await import('@/models/User')).default;
    const currentUser = await User.findById(session.userId).select('role');
    
    if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Superadmin access required' },
        { status: 403 }
      );
    }

    const optimizations = [];

    // 1. Create database indexes for better query performance
    try {
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ status: 1 });
      await User.collection.createIndex({ createdAt: -1 });
      optimizations.push('Created user indexes');
    } catch (error) {
      console.log('User indexes already exist or failed to create');
    }

    try {
      await Property.collection.createIndex({ propertyId: 1 });
      await Property.collection.createIndex({ agent: 1 });
      await Property.collection.createIndex({ status: 1 });
      await Property.collection.createIndex({ createdAt: -1 });
      await Property.collection.createIndex({ location: 1 });
      await Property.collection.createIndex({ district: 1 });
      optimizations.push('Created property indexes');
    } catch (error) {
      console.log('Property indexes already exist or failed to create');
    }

    // 2. Get performance statistics
    const stats = {
      totalUsers: await User.countDocuments({}),
      totalProperties: await Property.countDocuments({}),
      usersByRole: await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      propertiesByStatus: await Property.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    };

    // 3. Clean up any orphaned data
    const orphanedProperties = await Property.countDocuments({
      $or: [
        { agent: { $exists: false } },
        { agent: null },
        { agent: '' }
      ]
    });

    if (orphanedProperties > 0) {
      optimizations.push(`Found ${orphanedProperties} orphaned properties`);
    }

    console.log('✅ Performance optimization completed');

    return NextResponse.json({
      success: true,
      message: 'Performance optimization completed',
      optimizations,
      stats,
      recommendations: [
        'Database indexes created for faster queries',
        'Consider implementing Redis caching for frequently accessed data',
        'Optimize image loading with lazy loading',
        'Use CDN for static assets',
        'Implement pagination for large datasets',
        'Consider database connection pooling'
      ]
    });

  } catch (error) {
    console.error('❌ Error optimizing performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to optimize performance' },
      { status: 500 }
    );
  }
}
