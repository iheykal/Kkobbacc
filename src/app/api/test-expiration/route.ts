import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';
import { getSessionFromRequest } from '@/lib/sessionUtils';

/**
 * Test API for Property Expiration
 * 
 * GET /api/test-expiration - Test expiration filtering
 * POST /api/test-expiration - Create test property that expires in 5 minutes
 */

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);

    // Test query filters
    const testQuery = {
      deletionStatus: { $nin: ['deleted', 'pending_deletion'] },
      $and: [
        {
          $or: [
            { isExpired: { $ne: true } },
            { isExpired: { $exists: false } }
          ]
        },
        {
          $or: [
            { expiresAt: { $gte: now } },
            { expiresAt: { $exists: false } }
          ]
        }
      ],
      $nor: [
        { isExpired: true },
        { expiresAt: { $lt: now } }
      ]
    };

    // Get all properties (including expired for testing)
    const allProperties = await Property.find({}).lean();
    
    // Get properties matching our filter (should exclude expired)
    const filteredProperties = await Property.find(testQuery).lean();

    // Get explicitly expired properties
    const expiredProperties = await Property.find({
      $or: [
        { isExpired: true },
        { expiresAt: { $lt: now } }
      ]
    }).lean();

    // Test specific cases
    const testCases = [
      {
        name: 'Property with isExpired=true',
        query: { isExpired: true },
        shouldBeExcluded: true
      },
      {
        name: 'Property with expiresAt in past',
        query: { expiresAt: { $lt: now } },
        shouldBeExcluded: true
      },
      {
        name: 'Property with expiresAt in future',
        query: { expiresAt: { $gte: now } },
        shouldBeExcluded: false
      },
      {
        name: 'Property with expiresAt in 5 minutes',
        query: { expiresAt: { $gte: in5Minutes, $lt: new Date(in5Minutes.getTime() + 1000) } },
        shouldBeExcluded: false
      }
    ];

    const testResults = await Promise.all(
      testCases.map(async (testCase) => {
        const matchingProperties = await Property.find(testCase.query).lean();
        
        // Check if matching properties are in the filtered results
        const matchingIds = matchingProperties.map((p: any) => p._id.toString());
        const filteredIds = filteredProperties.map((p: any) => p._id.toString());
        
        // Check if properties match the filter expectation
        const inFiltered = matchingIds.filter(id => filteredIds.includes(id));
        const matchesFilter = testCase.shouldBeExcluded 
          ? inFiltered.length === 0 // Should be excluded, so should NOT be in filtered results
          : inFiltered.length === matchingProperties.length; // Should be included, so should all be in filtered results

        return {
          ...testCase,
          matchingCount: matchingProperties.length,
          inFilteredCount: inFiltered.length,
          matchesFilter,
          details: {
            matchingIds: matchingIds.slice(0, 5), // First 5 for debugging
            inFilteredIds: inFiltered.slice(0, 5)
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      test: {
        timestamp: now.toISOString(),
        in5Minutes: in5Minutes.toISOString(),
        totalProperties: allProperties.length,
        filteredProperties: filteredProperties.length,
        expiredProperties: expiredProperties.length,
        testResults
      },
      query: testQuery,
      summary: {
        total: allProperties.length,
        filtered: filteredProperties.length,
        expired: expiredProperties.length,
        active: filteredProperties.length,
        allTestsPassed: testResults.every(t => t.matchesFilter)
      }
    });

  } catch (error) {
    console.error('❌ Test expiration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or superadmin
    const isAdmin = session.role === 'admin' || session.role === 'superadmin' || session.role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only admins can create test properties' },
        { status: 403 }
      );
    }

    // Get or create a test agent
    const User = (await import('@/models/User')).default;
    let testAgent = await User.findOne({ email: 'test-agent@kobac.test' });
    
    if (!testAgent) {
      testAgent = await User.create({
        email: 'test-agent@kobac.test',
        firstName: 'Test',
        lastName: 'Agent',
        phone: '2521234567890',
        role: 'agent',
        passwordHash: 'test-hash' // Not used for testing
      });
    }

    // Calculate expiration time (5 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // Get next property ID
    const propertyId = await getNextPropertyId();

    // Create test property that expires in 5 minutes
    const testProperty = await Property.create({
      propertyId,
      title: `🧪 TEST PROPERTY - Expires in 5 minutes (${expiresAt.toLocaleTimeString()})`,
      location: 'Test Location',
      district: 'Test District',
      price: 100000,
      beds: 3,
      baths: 2,
      sqft: 1500,
      propertyType: 'house',
      listingType: 'sale',
      status: 'For Sale',
      description: 'This is a test property created to verify expiration filtering. It will expire in 5 minutes.',
      features: ['Test Feature 1', 'Test Feature 2'],
      amenities: ['Test Amenity 1'],
      thumbnailImage: '',
      images: [],
      agentId: testAgent._id,
      agent: {
        name: testAgent.fullName || `${testAgent.firstName} ${testAgent.lastName}`,
        phone: testAgent.phone || '2521234567890',
        image: testAgent.avatar || '',
        rating: 5
      },
      expiresAt: expiresAt,
      isExpired: false, // Will be false initially, but will expire in 5 minutes
      deletionStatus: 'active'
    });

    return NextResponse.json({
      success: true,
      message: 'Test property created successfully',
      property: {
        id: testProperty._id,
        propertyId: testProperty.propertyId,
        title: testProperty.title,
        expiresAt: testProperty.expiresAt,
        expiresAtISO: testProperty.expiresAt.toISOString(),
        expiresIn: '5 minutes',
        createdAt: testProperty.createdAt,
        createdAtISO: testProperty.createdAt.toISOString()
      },
      test: {
        currentTime: now.toISOString(),
        expirationTime: expiresAt.toISOString(),
        timeUntilExpiration: '5 minutes',
        expirationTimestamp: expiresAt.getTime()
      }
    });

  } catch (error) {
    console.error('❌ Create test property error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

