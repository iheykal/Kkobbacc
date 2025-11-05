import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export const runtime = 'nodejs';

/**
 * POST /api/admin/debug-and-fix-properties
 * Debug and fix existing properties with image issues
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Debug and fix properties request received');
    
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

    const body = await request.json();
    const { propertyId, action = 'debug' } = body;

    // Connect to database
    await connectToDatabase();

    const results: {
      action: string;
      propertyId: number | undefined;
      success: boolean;
      data: any;
      issues: any[];
      fixes: any[];
      message: string;
    } = {
      action,
      propertyId,
      success: false,
      data: null,
      issues: [],
      fixes: [],
      message: ''
    };

    if (action === 'debug') {
      // Debug specific property or all properties
      if (propertyId) {
        results.data = await debugSpecificProperty(propertyId);
      } else {
        results.data = await debugAllProperties();
      }
      results.success = true;
      results.message = 'Debug completed successfully';
      
    } else if (action === 'fix') {
      // Fix specific property
      if (!propertyId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Property ID is required for fix action' 
        }, { status: 400 });
      }
      
      results.data = await fixSpecificProperty(propertyId);
      results.success = true;
      results.message = 'Fix completed successfully';
      
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use "debug" or "fix"' 
      }, { status: 400 });
    }

    return NextResponse.json(results);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Debug and fix properties error:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

async function debugSpecificProperty(propertyId: number | string) {
  console.log(`🔍 Debugging property ${propertyId}`);
  
  // Find property by propertyId or _id
  let property = await Property.findOne({ propertyId: Number(propertyId) });
  if (!property) {
    property = await Property.findById(propertyId);
  }
  
  if (!property) {
    return {
      found: false,
      error: 'Property not found'
    };
  }

  const analysis: {
    found: boolean;
    propertyId: number | undefined;
    _id: any;
    title: string;
    thumbnailImage: string | undefined;
    images: string[];
    issues: Array<{
      type: string;
      message: string;
      currentUrl?: string;
      index?: number;
    }>;
    fixes: Array<{
      type: string;
      oldUrl?: string;
      newUrl?: string;
      index?: number;
    }>;
  } = {
    found: true,
    propertyId: property.propertyId,
    _id: property._id,
    title: property.title,
    thumbnailImage: property.thumbnailImage,
    images: property.images || [],
    issues: [],
    fixes: []
  };

  // Check thumbnail image
  if (!property.thumbnailImage || property.thumbnailImage.trim() === '') {
    analysis.issues.push({
      type: 'missing_thumbnail',
      message: 'No thumbnail image set'
    });
  } else {
    // Check if thumbnail uses correct bucket
    if (!property.thumbnailImage.includes('126b4cc26d8041e99d7cc45ade6cfd3b')) {
      analysis.issues.push({
        type: 'wrong_bucket_thumbnail',
        message: 'Thumbnail uses wrong bucket',
        currentUrl: property.thumbnailImage
      });
      
      analysis.fixes.push({
        type: 'fix_thumbnail_bucket',
        oldUrl: property.thumbnailImage,
        newUrl: fixImageUrl(property.thumbnailImage)
      });
    }
  }

  // Check images array
  if (!property.images || !Array.isArray(property.images) || property.images.length === 0) {
    analysis.issues.push({
      type: 'missing_images',
      message: 'No images array or empty array'
    });
  } else {
    property.images.forEach((imageUrl, index) => {
      if (!imageUrl || imageUrl.trim() === '') {
        analysis.issues.push({
          type: 'empty_image',
          message: `Image ${index} is empty`,
          index
        });
      } else if (!imageUrl.includes('126b4cc26d8041e99d7cc45ade6cfd3b')) {
        analysis.issues.push({
          type: 'wrong_bucket_image',
          message: `Image ${index} uses wrong bucket`,
          currentUrl: imageUrl,
          index
        });
        
        analysis.fixes.push({
          type: 'fix_image_bucket',
          oldUrl: imageUrl,
          newUrl: fixImageUrl(imageUrl),
          index
        });
      }
    });
  }

  return analysis;
}

async function debugAllProperties() {
  console.log('🔍 Debugging all properties');
  
  const properties = await Property.find({}).limit(50); // Limit to first 50 for performance
  
  const results: {
    totalProperties: number;
    propertiesWithIssues: number;
    propertiesFixed: number;
    issues: {
      missingThumbnail: number;
      missingImages: number;
      wrongBucket: number;
    };
    details: Array<{
      found: boolean;
      propertyId: number | undefined;
      _id: any;
      title: string;
      thumbnailImage: string | undefined;
      images: string[];
      issues: Array<{
        type: string;
        message: string;
        currentUrl?: string;
        index?: number;
      }>;
      fixes: Array<{
        type: string;
        oldUrl?: string;
        newUrl?: string;
        index?: number;
      }>;
    }>;
  } = {
    totalProperties: properties.length,
    propertiesWithIssues: 0,
    propertiesFixed: 0,
    issues: {
      missingThumbnail: 0,
      missingImages: 0,
      wrongBucket: 0
    },
    details: []
  };

  for (const property of properties) {
    const analysis = await debugSpecificProperty(property.propertyId || String(property._id));
    
    if (analysis.found && 'issues' in analysis && analysis.issues.length > 0) {
      results.propertiesWithIssues++;
      results.details.push(analysis);
      
      // Count issue types
      analysis.issues.forEach(issue => {
        switch (issue.type) {
          case 'missing_thumbnail':
            results.issues.missingThumbnail++;
            break;
          case 'missing_images':
            results.issues.missingImages++;
            break;
          case 'wrong_bucket_thumbnail':
          case 'wrong_bucket_image':
            results.issues.wrongBucket++;
            break;
        }
      });
    }
  }

  return results;
}

async function fixSpecificProperty(propertyId: number | string) {
  console.log(`🔧 Fixing property ${propertyId}`);
  
  // First debug to get issues and fixes
  const analysis = await debugSpecificProperty(propertyId);
  
  if (!analysis.found) {
    return {
      success: false,
      error: 'Property not found'
    };
  }

  if (!('fixes' in analysis) || analysis.fixes.length === 0) {
    return {
      success: true,
      message: 'No fixes needed',
      analysis
    };
  }

  // Apply fixes
  const updateData: any = {};
  
  analysis.fixes.forEach(fix => {
    if (fix.type === 'fix_thumbnail_bucket') {
      updateData.thumbnailImage = fix.newUrl;
    } else if (fix.type === 'fix_image_bucket' && fix.index !== undefined) {
      if (!updateData.images) {
        updateData.images = [...analysis.images];
      }
      updateData.images[fix.index] = fix.newUrl;
    }
  });

  // Update the property
  const updatedProperty = await Property.findByIdAndUpdate(
    analysis._id,
    { $set: updateData },
    { new: true }
  );

  if (updatedProperty) {
    return {
      success: true,
      message: `Fixed ${analysis.fixes.length} issues`,
      analysis,
      updatedData: {
        thumbnailImage: updatedProperty.thumbnailImage,
        images: updatedProperty.images
      }
    };
  } else {
    return {
      success: false,
      error: 'Failed to update property'
    };
  }
}

function fixImageUrl(url: string) {
  // Extract the path part after /properties/
  const pathMatch = url.match(/\/properties\/(.+)$/);
  if (pathMatch) {
    return `https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/properties/${pathMatch[1]}`;
  }
  
  // Fallback: replace any bucket with correct one
  return url.replace(/pub-[a-f0-9]+\.r2\.dev/, 'pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev');
}
