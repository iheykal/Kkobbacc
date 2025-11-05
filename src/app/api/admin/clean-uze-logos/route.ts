import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Find properties that have Uze logos in their images
    const propertiesWithUzeLogos = await Property.find({
      $or: [
        { thumbnailImage: { $regex: /uze\.png/i } },
        { images: { $regex: /uze\.png/i } }
      ]
    }).select('propertyId title thumbnailImage images');
    
    // Count total properties
    const totalProperties = await Property.countDocuments();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalProperties,
        propertiesWithUzeLogos: propertiesWithUzeLogos.length,
        propertiesWithoutUzeLogos: totalProperties - propertiesWithUzeLogos.length
      },
      propertiesWithUzeLogos: propertiesWithUzeLogos.map(p => ({
        propertyId: p.propertyId,
        title: p.title,
        thumbnailImage: p.thumbnailImage,
        images: p.images
      }))
    });
  } catch (error) {
    console.error('Error checking for Uze logos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check for Uze logos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('🧹 Starting Uze logo cleanup...');
    
    // Find and update properties with Uze logos in thumbnailImage
    const thumbnailUpdateResult = await Property.updateMany(
      { thumbnailImage: { $regex: /uze\.png/i } },
      { 
        $set: { 
          thumbnailImage: 'https://picsum.photos/400/300?random=1' 
        } 
      }
    );
    
    // Find and update properties with Uze logos in images array
    const imagesUpdateResult = await Property.updateMany(
      { images: { $regex: /uze\.png/i } },
      { 
        $pull: { 
          images: { $regex: /uze\.png/i } 
        } 
      }
    );
    
    // Also remove any /icons/ paths from images array
    const iconsUpdateResult = await Property.updateMany(
      { images: { $regex: /\/icons\//i } },
      { 
        $pull: { 
          images: { $regex: /\/icons\//i } 
        } 
      }
    );
    
    console.log('🧹 Cleanup results:', {
      thumbnailUpdated: thumbnailUpdateResult.modifiedCount,
      imagesUpdated: imagesUpdateResult.modifiedCount,
      iconsUpdated: iconsUpdateResult.modifiedCount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Uze logos cleaned from properties',
      results: {
        thumbnailUpdated: thumbnailUpdateResult.modifiedCount,
        imagesUpdated: imagesUpdateResult.modifiedCount,
        iconsUpdated: iconsUpdateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error cleaning Uze logos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean Uze logos' },
      { status: 500 }
    );
  }
}
