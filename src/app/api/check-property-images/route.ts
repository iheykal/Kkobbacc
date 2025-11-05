import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Checking property images for WebP conversion status...');
    
    await dbConnect();
    
    // Get all properties with their images
    const properties = await Property.find({}, {
      propertyId: 1,
      title: 1,
      thumbnailImage: 1,
      images: 1,
      createdAt: 1
    }).limit(20); // Limit to first 20 for testing
    
    console.log(`📊 Found ${properties.length} properties to check`);
    
    const results = properties.map(property => {
      const allImages = [
        property.thumbnailImage,
        ...(property.images || [])
      ].filter(Boolean);
      
      const imageAnalysis = allImages.map(imageUrl => {
        if (!imageUrl) return null;
        
        // Check if URL contains .webp
        const isWebP = imageUrl.includes('.webp');
        
        // Extract file extension from URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const extension = filename.split('.').pop()?.toLowerCase();
        
        // Check if it's from R2 (Cloudflare)
        const isR2 = imageUrl.includes('r2.dev') || imageUrl.includes('r2.cloudflarestorage.com');
        
        return {
          url: imageUrl,
          filename,
          extension,
          isWebP,
          isR2,
          format: isWebP ? 'WebP' : extension?.toUpperCase() || 'Unknown'
        };
      }).filter(Boolean);
      
      return {
        propertyId: property.propertyId,
        title: property.title,
        createdAt: property.createdAt,
        totalImages: allImages.length,
        images: imageAnalysis,
        webpCount: imageAnalysis.filter(img => img?.isWebP).length,
        nonWebpCount: imageAnalysis.filter(img => !img?.isWebP).length,
        r2Count: imageAnalysis.filter(img => img?.isR2).length
      };
    });
    
    // Calculate overall statistics
    const totalProperties = results.length;
    const totalImages = results.reduce((sum, prop) => sum + prop.totalImages, 0);
    const totalWebPImages = results.reduce((sum, prop) => sum + prop.webpCount, 0);
    const totalNonWebPImages = results.reduce((sum, prop) => sum + prop.nonWebpCount, 0);
    const totalR2Images = results.reduce((sum, prop) => sum + prop.r2Count, 0);
    
    const webpPercentage = totalImages > 0 ? ((totalWebPImages / totalImages) * 100).toFixed(1) : '0';
    
    console.log('📊 Property Image Analysis Results:');
    console.log(`   Total Properties: ${totalProperties}`);
    console.log(`   Total Images: ${totalImages}`);
    console.log(`   WebP Images: ${totalWebPImages} (${webpPercentage}%)`);
    console.log(`   Non-WebP Images: ${totalNonWebPImages}`);
    console.log(`   R2 Images: ${totalR2Images}`);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalProperties,
        totalImages,
        webpImages: totalWebPImages,
        nonWebpImages: totalNonWebPImages,
        r2Images: totalR2Images,
        webpPercentage: `${webpPercentage}%`
      },
      properties: results,
      message: `Analyzed ${totalProperties} properties with ${totalImages} total images. ${webpPercentage}% are in WebP format.`
    });
    
  } catch (error) {
    console.error('❌ Error checking property images:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check property images' 
      },
      { status: 500 }
    );
  }
}
