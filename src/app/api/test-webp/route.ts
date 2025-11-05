import { NextRequest, NextResponse } from 'next/server';
import { processImageFile } from '@/lib/imageProcessor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File is not an image' }, { status: 400 });
    }
    
    console.log('🔄 Testing WebP conversion for:', file.name);
    console.log('📊 Original file size:', file.size, 'bytes');
    console.log('📋 Original file type:', file.type);
    
    // Process image to WebP
    const processedImage = await processImageFile(file, {
      quality: 85,
      width: 800,
      height: 600,
      fit: 'inside'
    });
    
    console.log('✅ WebP conversion successful!');
    console.log('📊 Processed file size:', processedImage.buffer.length, 'bytes');
    console.log('📋 Processed file type:', processedImage.contentType);
    console.log('📁 Generated filename:', processedImage.filename);
    
    const sizeReduction = ((file.size - processedImage.buffer.length) / file.size * 100).toFixed(1);
    
    return NextResponse.json({
      success: true,
      original: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      processed: {
        name: processedImage.filename,
        size: processedImage.buffer.length,
        type: processedImage.contentType
      },
      stats: {
        sizeReduction: `${sizeReduction}%`,
        compressionRatio: (file.size / processedImage.buffer.length).toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('❌ WebP conversion test failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WebP conversion test endpoint',
    usage: 'POST with form data containing an image file',
    supportedFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'TIFF'],
    outputFormat: 'WebP',
    features: [
      'Automatic quality optimization (85%)',
      'Resize to max 800x600',
      'Maintain aspect ratio',
      'File size reduction typically 50-80%'
    ]
  });
}
