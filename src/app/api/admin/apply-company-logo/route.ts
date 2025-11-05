import { NextRequest, NextResponse } from 'next/server';
import { safeConnectDB } from '@/lib/db-utils';
import Property from '@/models/Property';
import { getCompanyLogoUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting company logo application to existing properties...');
    
    const dbConnection = await safeConnectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }
    console.log('✅ Database connected');
    
    // Get company logo URL
    const companyLogoUrl = getCompanyLogoUrl();
    console.log('🏢 Company logo URL:', companyLogoUrl);
    
    if (!companyLogoUrl) {
      return NextResponse.json(
        { success: false, error: 'Company logo is not configured' },
        { status: 400 }
      );
    }
    
    // Find all properties that don't have the company logo
    const propertiesToUpdate = await Property.find({
      $or: [
        { images: { $not: { $elemMatch: { $eq: companyLogoUrl } } } },
        { images: { $exists: false } },
        { images: null }
      ]
    });
    
    console.log(`📋 Found ${propertiesToUpdate.length} properties to update`);
    
    if (propertiesToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All properties already have the company logo',
        updatedCount: 0
      });
    }
    
    // Update each property to include the company logo
    let updatedCount = 0;
    const updateResults = [];
    
    for (const property of propertiesToUpdate) {
      try {
        // Get current images array or create empty array
        const currentImages = property.images || [];
        
        // Add company logo if it's not already there
        if (!currentImages.includes(companyLogoUrl)) {
          currentImages.push(companyLogoUrl);
          
          // Update the property
          await Property.findByIdAndUpdate(property._id, {
            $set: { images: currentImages }
          });
          
          updatedCount++;
          updateResults.push({
            propertyId: property.propertyId,
            title: property.title,
            oldImageCount: currentImages.length - 1,
            newImageCount: currentImages.length
          });
          
          console.log(`✅ Updated property ${property.propertyId}: ${property.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to update property ${property.propertyId}:`, error);
        updateResults.push({
          propertyId: property.propertyId,
          title: property.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} properties with company logo`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully applied company logo to ${updatedCount} properties`,
      companyLogoUrl,
      updatedCount,
      totalProperties: propertiesToUpdate.length,
      results: updateResults
    });
    
  } catch (error) {
    console.error('💥 Error applying company logo to properties:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const dbConnection = await safeConnectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }
    
    // Get company logo URL
    const companyLogoUrl = getCompanyLogoUrl();
    
    // Count properties with and without the logo
    const totalProperties = await Property.countDocuments();
    const propertiesWithLogo = await Property.countDocuments({
      images: { $elemMatch: { $eq: companyLogoUrl } }
    });
    const propertiesWithoutLogo = totalProperties - propertiesWithLogo;
    
    return NextResponse.json({
      success: true,
      companyLogoUrl,
      stats: {
        totalProperties,
        propertiesWithLogo,
        propertiesWithoutLogo
      },
      message: companyLogoUrl ? 'Company logo is configured' : 'Company logo is not configured'
    });
    
  } catch (error) {
    console.error('Error getting company logo stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get company logo statistics' },
      { status: 500 }
    );
  }
}
