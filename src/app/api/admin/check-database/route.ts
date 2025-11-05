import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function GET(request: NextRequest) {
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

    // Connect to database
    const db = await connectToDatabase();
    
    const results = {
      connected: false,
      totalProperties: 0,
      sampleCount: 0,
      databaseInfo: {
        name: 'Unknown',
        collection: 'Unknown',
        connectionString: 'Unknown'
      },
      sampleProperties: [] as any[]
    };

    if (db) {
      results.connected = true;
      
      // Get database name
      if (db.databaseName) {
        results.databaseInfo.name = db.databaseName;
      }
      
      // Get collection name
      results.databaseInfo.collection = 'properties';
      
      // Get connection string (masked for security)
      if (process.env.MONGODB_URI) {
        const maskedUri = process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
        results.databaseInfo.connectionString = maskedUri;
      }

      // Count total properties
      results.totalProperties = await Property.countDocuments({});
      
      // Get sample properties (limit to 5)
      if (results.totalProperties > 0) {
        const sampleProperties = await Property.find({}).limit(5).lean();
        results.sampleProperties = sampleProperties;
        results.sampleCount = sampleProperties.length;
      }
    }

    console.log(`🗄️ Database check completed:`, {
      connected: results.connected,
      totalProperties: results.totalProperties,
      sampleCount: results.sampleCount
    });

    return NextResponse.json({
      success: true,
      message: `Database check completed`,
      results
    });

  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check database' },
      { status: 500 }
    );
  }
}
