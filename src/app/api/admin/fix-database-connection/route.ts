import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    const results = {
      connected: false,
      totalProperties: 0,
      withImages: 0,
      connectionDetails: {
        databaseName: 'Unknown',
        collectionName: 'Unknown',
        connectionString: 'Unknown',
        hasEnvVar: false
      },
      error: null as string | null
    };

    // Check if MONGODB_URI environment variable exists
    if (process.env.MONGODB_URI) {
      results.connectionDetails.hasEnvVar = true;
      results.connectionDetails.connectionString = process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    } else {
      results.error = 'MONGODB_URI environment variable is not set';
      return NextResponse.json({
        success: false,
        message: 'Database connection failed - missing environment variable',
        results
      });
    }

    try {
      // Attempt to connect to database
      const db = await connectToDatabase();
      
      if (db) {
        results.connected = true;
        results.connectionDetails.databaseName = db.databaseName || 'Unknown';
        results.connectionDetails.collectionName = 'properties';
        
        // Count total properties
        results.totalProperties = await Property.countDocuments({});
        
        // Count properties with images
        const propertiesWithImages = await Property.find({
          $or: [
            { thumbnailImage: { $exists: true, $nin: ['', null] } },
            { images: { $exists: true, $nin: [[], null] } }
          ]
        });
        results.withImages = propertiesWithImages.length;
        
        console.log(`✅ Database connection successful:`, {
          connected: results.connected,
          totalProperties: results.totalProperties,
          withImages: results.withImages
        });
      } else {
        results.error = 'Failed to establish database connection';
      }
      
    } catch (dbError) {
      results.error = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database connection error:', dbError);
    }

    return NextResponse.json({
      success: results.connected,
      message: results.connected ? 'Database connection successful' : 'Database connection failed',
      results
    });

  } catch (error) {
    console.error('Error fixing database connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix database connection' },
      { status: 500 }
    );
  }
}
