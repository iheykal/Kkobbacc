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

    // Connect to database
    await connectToDatabase();

    // Find properties with missing or incorrect deletionStatus
    const propertiesToFix = await Property.find({
      $or: [
        { deletionStatus: { $exists: false } },
        { deletionStatus: null },
        { deletionStatus: '' },
        { deletionStatus: 'pending' } // Also fix pending deletions
      ]
    });

    console.log(`🔍 Found ${propertiesToFix.length} properties with status issues`);

    const results = {
      total: propertiesToFix.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Fix each property
    for (const property of propertiesToFix) {
      try {
        const oldStatus = property.deletionStatus;
        
        // Set deletionStatus to 'active' for properties that should be visible
        property.deletionStatus = 'active';
        
        await property.save();
        
        results.fixed++;
        results.details.push({
          propertyId: property._id,
          title: property.title,
          oldStatus: oldStatus || 'missing',
          newStatus: 'active',
          fixType: 'status_fix'
        });
        
        console.log(`✅ Fixed property ${property._id}: ${oldStatus || 'missing'} → active`);
        
      } catch (error) {
        results.errors++;
        results.details.push({
          propertyId: property._id,
          title: property.title,
          error: error instanceof Error ? error.message : 'Unknown error',
          fixType: 'error'
        });
        
        console.error(`❌ Error fixing property ${property._id}:`, error);
      }
    }

    console.log(`🎯 Fix completed: ${results.fixed} fixed, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.fixed} properties with status issues`,
      results
    });

  } catch (error) {
    console.error('Error fixing properties status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix properties status' },
      { status: 500 }
    );
  }
}