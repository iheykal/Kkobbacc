import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import User from '@/models/User';
import { getNextPropertyId } from '@/lib/propertyIdGenerator';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🧪 Testing property visibility...');
    
    // Find a real agent
    const realAgent = await User.findOne({ 
      role: { $in: ['agent', 'agency'] } 
    }).select('_id firstName lastName fullName');
    
    if (!realAgent) {
      return NextResponse.json({
        success: false,
        error: 'No agents found in the system.'
      }, { status: 400 });
    }
    
    // Generate next property ID
    const nextPropertyId = await getNextPropertyId();
    
    // Create a simple test property
    const testPropertyData = {
      propertyId: nextPropertyId,
      title: `Visibility Test - ${Date.now()}`,
      location: 'Test Location',
      district: 'Hodan',
      price: 100000,
      beds: 2,
      baths: 1,
      sqft: 1000,
      yearBuilt: 2020,
      lotSize: 500,
      propertyType: 'apartment',
      listingType: 'sale',
      status: 'For Sale',
      description: 'Testing property visibility',
      features: ['Test'],
      amenities: ['Test'],
      thumbnailImage: 'https://picsum.photos/400/300?random=' + Date.now(),
      images: [],
      agentId: realAgent._id,
      agent: {
        name: realAgent.fullName || `${realAgent.firstName} ${realAgent.lastName}`,
        phone: '123-456-7890',
        image: 'https://picsum.photos/100/100?random=' + Date.now(),
        rating: 5.0
      },
      deletionStatus: 'active'
    };
    
    console.log('🏗️ Creating test property:', {
      title: testPropertyData.title,
      agentId: testPropertyData.agentId,
      deletionStatus: testPropertyData.deletionStatus
    });
    
    // Create and save property
    const property = new Property(testPropertyData);
    await property.save();
    
    console.log('✅ Property created with ID:', property._id);
    
    // Immediately check if it's visible
    const visibleProperties = await Property.find({ deletionStatus: { $ne: 'deleted' } });
    const ourProperty = visibleProperties.find(p => String((p as any)._id) === String((property as any)._id));
    
    console.log('🔍 Visibility check:', {
      totalVisible: visibleProperties.length,
      ourPropertyFound: !!ourProperty,
      ourPropertyStatus: ourProperty?.deletionStatus
    });
    
    // Check the exact query used by main page
    const mainPageQuery = { deletionStatus: { $ne: 'deleted' } };
    const mainPageProperties = await Property.find(mainPageQuery)
      .populate('agentId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const ourPropertyInMainPage = mainPageProperties.find(p => String((p as any)._id) === String((property as any)._id));
    
    console.log('🔍 Main page query check:', {
      mainPageFound: mainPageProperties.length,
      ourPropertyInMainPage: !!ourPropertyInMainPage
    });
    
    // Clean up - delete the test property
    await Property.findByIdAndDelete(property._id);
    console.log('🧹 Test property cleaned up');
    
    return NextResponse.json({
      success: true,
      data: {
        propertyCreated: {
          id: property._id,
          title: property.title,
          deletionStatus: property.deletionStatus,
          agentId: property.agentId
        },
        visibilityTest: {
          totalVisible: visibleProperties.length,
          ourPropertyFound: !!ourProperty,
          ourPropertyStatus: ourProperty?.deletionStatus
        },
        mainPageTest: {
          mainPageFound: mainPageProperties.length,
          ourPropertyInMainPage: !!ourPropertyInMainPage
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Error in property visibility test:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}


