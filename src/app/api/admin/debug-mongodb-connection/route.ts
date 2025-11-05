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
      envVar: false,
      connection: false,
      database: false,
      collection: false,
      connectionString: '',
      databaseName: '',
      collectionName: '',
      error: null as string | null,
      steps: [] as any[]
    };

    // Step 1: Check environment variable
    results.steps.push({
      name: 'Check Environment Variable',
      success: false,
      message: 'Checking if MONGODB_URI is set'
    });

    // Debug: Log all environment variables
    console.log('🔍 Debug MongoDB - All env vars:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
      R2_BUCKET: process.env.R2_BUCKET ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV
    });

    if (!process.env.MONGODB_URI) {
      results.error = 'MONGODB_URI environment variable is not set';
      results.steps[0].message = 'MONGODB_URI is missing from environment variables';
      console.log('❌ MONGODB_URI is missing in admin route');
      return NextResponse.json({
        success: false,
        message: 'Environment variable missing',
        results
      });
    }

    results.envVar = true;
    results.connectionString = process.env.MONGODB_URI;
    results.steps[0].success = true;
    results.steps[0].message = 'MONGODB_URI is set';

    // Step 2: Test connection
    results.steps.push({
      name: 'Test MongoDB Connection',
      success: false,
      message: 'Attempting to connect to MongoDB'
    });

    try {
      const db = await connectToDatabase();
      
      if (db) {
        results.connection = true;
        results.databaseName = db.databaseName || 'Unknown';
        results.steps[1].success = true;
        results.steps[1].message = 'Successfully connected to MongoDB';
      } else {
        results.error = 'Failed to establish database connection';
        results.steps[1].message = 'Connection returned null';
        return NextResponse.json({
          success: false,
          message: 'Database connection failed',
          results
        });
      }
    } catch (connectionError) {
      results.error = connectionError instanceof Error ? connectionError.message : 'Unknown connection error';
      results.steps[1].message = `Connection failed: ${results.error}`;
      return NextResponse.json({
        success: false,
        message: 'Database connection error',
        results
      });
    }

    // Step 3: Test database access
    results.steps.push({
      name: 'Test Database Access',
      success: false,
      message: 'Testing database access'
    });

    try {
      // Try to access the database
      const db = await connectToDatabase();
      if (db) {
        results.database = true;
        results.steps[2].success = true;
        results.steps[2].message = 'Database access successful';
      }
    } catch (dbError) {
      results.error = dbError instanceof Error ? dbError.message : 'Database access error';
      results.steps[2].message = `Database access failed: ${results.error}`;
      return NextResponse.json({
        success: false,
        message: 'Database access error',
        results
      });
    }

    // Step 4: Test collection access
    results.steps.push({
      name: 'Test Collection Access',
      success: false,
      message: 'Testing properties collection access'
    });

    try {
      // Try to access the properties collection
      const count = await Property.countDocuments({});
      results.collection = true;
      results.collectionName = 'properties';
      results.steps[3].success = true;
      results.steps[3].message = `Collection access successful (${count} documents)`;
    } catch (collectionError) {
      results.error = collectionError instanceof Error ? collectionError.message : 'Collection access error';
      results.steps[3].message = `Collection access failed: ${results.error}`;
      return NextResponse.json({
        success: false,
        message: 'Collection access error',
        results
      });
    }

    console.log(`🔍 MongoDB debug completed:`, {
      envVar: results.envVar,
      connection: results.connection,
      database: results.database,
      collection: results.collection
    });

    return NextResponse.json({
      success: true,
      message: 'MongoDB debug completed',
      results
    });

  } catch (error) {
    console.error('Error debugging MongoDB connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to debug MongoDB connection' },
      { status: 500 }
    );
  }
}
