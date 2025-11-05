import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';
import { DEFAULT_AVATAR_URL } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Generate next property ID
    const nextPropertyId = await getNextPropertyId();
    
    // Find a real agent to use for the test property
    const realAgent = await User.findOne({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName email phone avatar profile.avatar');
    
    if (!realAgent) {
      return NextResponse.json({
        success: false,
        error: 'No agents found in the system. Please create an agent first.'
      }, { status: 400 });
    }
    
    console.log('👤 Using real agent for test property:', {
      agentId: realAgent._id,
      agentName: realAgent.fullName || `${realAgent.firstName} ${realAgent.lastName}`,
      agentRole: realAgent.role
    });
    
    // Automatically append Somali language suffix based on listing type
    const listingType = 'sale'; // Test property is for sale
    const enhancedTitle = `Test Property - ${new Date().toISOString()} iib ah`;
    
    // Create a test property with real agent data
    const testPropertyData = {
      propertyId: nextPropertyId,
      title: enhancedTitle,
      location: 'Test Location',
      district: 'Hodan',
      price: 100000,
      beds: 3,
      baths: 2,
      sqft: 1500,
      yearBuilt: 2020,
      lotSize: 1000,
      propertyType: 'villa',
      listingType: listingType,
      status: 'For Sale',
      description: 'This is a test property created for debugging purposes.',
      features: ['Test Feature 1', 'Test Feature 2'],
      amenities: ['Test Amenity 1', 'Test Amenity 2'],
      thumbnailImage: 'https://picsum.photos/400/300?random=' + Date.now(),
      images: ['https://picsum.photos/400/300?random=' + (Date.now() + 1)],
      agentId: realAgent._id, // Use real agent ID
      agent: {
        name: realAgent.fullName || `${realAgent.firstName || ''} ${realAgent.lastName || ''}`.trim() || 'Test Agent',
        phone: realAgent.phone || '123-456-7890',
        image: realAgent.avatar || realAgent.profile?.avatar || DEFAULT_AVATAR_URL,
        rating: 5.0
      },
      deletionStatus: 'active'
    };
    
    console.log('🧪 Creating test property with data:', testPropertyData);
    
    // Create and save property
    const property = new Property(testPropertyData);
    await property.save();
    
    console.log('✅ Test property created successfully:', property._id);
    
    // Verify the property was saved correctly by fetching it
    const savedProperty = await Property.findById(property._id);
    console.log('🔍 Verification - Test property exists in database:', !!savedProperty);
    if (savedProperty) {
      console.log('🔍 Verification - Test property deletionStatus:', savedProperty.deletionStatus);
      console.log('🔍 Verification - Test property agentId:', savedProperty.agentId);
    }
    
    // Test the query that the main page uses
    const mainPageQuery = { deletionStatus: { $ne: 'deleted' } };
    const mainPageProperties = await Property.find(mainPageQuery).limit(5);
    console.log('🔍 Main page query test - Found properties:', mainPageProperties.length);
    
    // Test the exact query from the main properties API
    const exactMainPageQuery = { deletionStatus: { $ne: 'deleted' } };
    const exactMainPageProperties = await Property.find(exactMainPageQuery)
      .populate('agentId', 'firstName lastName email phone avatar profile.avatar licenseNumber fullName')
      .select('propertyId title location district price beds baths sqft yearBuilt lotSize propertyType listingType measurement status description features amenities thumbnailImage images agentId createdAt viewCount uniqueViewCount agent')
      .sort({ uniqueViewCount: -1, createdAt: -1 })
      .limit(10);
    
    console.log('🔍 Exact main page query test - Found properties:', exactMainPageProperties.length);
    
    // Check if our test property is in the results
    const testPropertyInResults = exactMainPageProperties.find((p: any) => String((p as any)._id) === String((property as any)._id));
    console.log('🔍 Test property found in main page results:', !!testPropertyInResults);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        createdProperty: {
          id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          deletionStatus: property.deletionStatus,
          agentId: property.agentId
        },
        agentUsed: {
          id: realAgent._id,
          name: realAgent.fullName || `${realAgent.firstName} ${realAgent.lastName}`,
          role: realAgent.role
        },
        mainPageQueryTest: {
          query: mainPageQuery,
          foundProperties: mainPageProperties.length,
          properties: mainPageProperties.map(p => ({
            id: p._id,
            title: p.title,
            deletionStatus: p.deletionStatus
          }))
        },
        exactMainPageQueryTest: {
          query: exactMainPageQuery,
          foundProperties: exactMainPageProperties.length,
          testPropertyFound: !!testPropertyInResults,
          properties: exactMainPageProperties.map(p => ({
            id: p._id,
            title: p.title,
            deletionStatus: p.deletionStatus,
            agentId: p.agentId
          }))
        }
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Error creating test property:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
