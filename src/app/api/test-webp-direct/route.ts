import { NextRequest, NextResponse } from 'next/server';
import { processImageFileSafe } from '@/lib/imageProcessor';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing WebP conversion directly...');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be an image' 
      }, { status: 400 });
    }
    
    console.log('📸 Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Test WebP conversion
    const processedImage = await processImageFileSafe(file, {
      quality: 85,
      width: 1920,
      height: 1080,
      fit: 'inside'
    });
    
    const sizeReduction = ((file.size - processedImage.buffer.length) / file.size * 100).toFixed(1);
    
    console.log('✅ WebP conversion test successful:', {
      originalSize: file.size,
      processedSize: processedImage.buffer.length,
      sizeReduction: `${sizeReduction}%`,
      filename: processedImage.filename,
      contentType: processedImage.contentType
    });
    
    return NextResponse.json({
      success: true,
      original: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      processed: {
        filename: processedImage.filename,
        contentType: processedImage.contentType,
        size: processedImage.buffer.length
      },
      stats: {
        sizeReduction: `${sizeReduction}%`,
        compressionRatio: (file.size / processedImage.buffer.length).toFixed(2),
        isWebP: processedImage.filename.endsWith('.webp')
      },
      message: `Successfully converted to WebP with ${sizeReduction}% size reduction`
    });
    
  } catch (error) {
    console.error('❌ WebP conversion test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'WebP conversion failed' 
      },
      { status: 500 }
    );
  }
}
