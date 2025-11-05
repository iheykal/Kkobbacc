import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import User from '@/models/User';
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

    const results = {
      connected: false,
      databaseName: '',
      connectionString: '',
      collections: [] as any[],
      propertiesCollection: null as any,
      usersCollection: null as any
    };

    // Connect to database
    try {
      const db = await connectToDatabase();
      
      if (db) {
        results.connected = true;
        results.databaseName = db.databaseName || 'Unknown';
        
        // Get connection string (masked for security)
        if (process.env.MONGODB_URI) {
          results.connectionString = process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
        }

        console.log(`🔍 Database connected: ${results.databaseName}`);
      } else {
        results.connected = false;
        return NextResponse.json({
          success: false,
          message: 'Database connection failed',
          results
        });
      }
    } catch (error) {
      results.connected = false;
      return NextResponse.json({
        success: false,
        message: 'Database connection error',
        results
      });
    }

    // Get all collections
    try {
      const db = await connectToDatabase();
      if (db) {
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
          const collectionName = collection.name;
          let count = 0;
          let sampleId = null;

          try {
            // Get document count
            count = await db.collection(collectionName).countDocuments();
            
            // Get a sample document ID
            if (count > 0) {
              const sampleDoc = await db.collection(collectionName).findOne({}, { projection: { _id: 1 } });
              if (sampleDoc) {
                sampleId = sampleDoc._id.toString();
              }
            }
          } catch (error) {
            console.error(`Error getting info for collection ${collectionName}:`, error);
          }

          results.collections.push({
            name: collectionName,
            count: count,
            sampleId: sampleId
          });
        }

        console.log(`🔍 Found ${results.collections.length} collections`);
      }
    } catch (error) {
      console.error('Error getting collections:', error);
    }

    // Check specific collections
    try {
      // Check Properties collection
      const propertiesCount = await Property.countDocuments({});
      const propertiesSample = await Property.findOne({}, { projection: { _id: 1 } });
      
      results.propertiesCollection = {
        name: 'properties',
        count: propertiesCount,
        sampleId: propertiesSample ? (propertiesSample._id as any).toString() : null
      };

      console.log(`🔍 Properties collection: ${propertiesCount} documents`);
    } catch (error) {
      console.error('Error checking properties collection:', error);
      results.propertiesCollection = {
        name: 'properties',
        count: 0,
        sampleId: null
      };
    }

    try {
      // Check Users collection
      const usersCount = await User.countDocuments({});
      const usersSample = await User.findOne({}, { projection: { _id: 1 } });
      
      results.usersCollection = {
        name: 'users',
        count: usersCount,
        sampleId: usersSample ? usersSample._id.toString() : null
      };

      console.log(`🔍 Users collection: ${usersCount} documents`);
    } catch (error) {
      console.error('Error checking users collection:', error);
      results.usersCollection = {
        name: 'users',
        count: 0,
        sampleId: null
      };
    }

    console.log(`🎯 Database collections check completed:`, {
      connected: results.connected,
      databaseName: results.databaseName,
      collectionsCount: results.collections.length,
      propertiesCount: results.propertiesCollection?.count || 0,
      usersCount: results.usersCollection?.count || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Database collections check completed',
      results
    });

  } catch (error) {
    console.error('Error checking database collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check database collections' },
      { status: 500 }
    );
  }
}
