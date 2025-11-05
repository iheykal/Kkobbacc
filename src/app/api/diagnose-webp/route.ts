import { NextRequest, NextResponse } from 'next/server';
import { getSharp } from '@/lib/dynamicImports';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File is not an image' }, { status: 400 });
    }
    
    console.log('🔍 Diagnosing WebP conversion for:', file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const diagnostics = {
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        bufferSize: buffer.length
      },
      sharpInfo: null as any,
      metadata: null as any,
      webpTest: null as any,
      recommendations: [] as string[]
    };
    
    // Test Sharp import
    try {
      const sharp = await getSharp();
      diagnostics.sharpInfo = {
        available: !!sharp,
        type: typeof sharp,
        isFunction: typeof sharp === 'function'
      };
      
      if (!sharp || typeof sharp !== 'function') {
        diagnostics.recommendations.push('Sharp library is not properly imported');
        return NextResponse.json({ diagnostics });
      }
    } catch (error) {
      diagnostics.sharpInfo = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push('Sharp library failed to load');
      return NextResponse.json({ diagnostics });
    }
    
    // Test image metadata
    try {
      const sharp = await getSharp();
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();
      
      diagnostics.metadata = {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        isAnimated: metadata.isAnimated,
        pages: metadata.pages
      };
      
      // Check for potential issues
      if (!metadata.width || !metadata.height) {
        diagnostics.recommendations.push('Image has invalid dimensions');
      }
      
      if (metadata.width > 10000 || metadata.height > 10000) {
        diagnostics.recommendations.push('Image is very large, consider resizing before WebP conversion');
      }
      
      if (metadata.isAnimated) {
        diagnostics.recommendations.push('Animated images may not convert well to WebP');
      }
      
    } catch (error) {
      diagnostics.metadata = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push('Failed to read image metadata');
    }
    
    // Test WebP conversion with different settings
    try {
      const sharp = await getSharp();
      const sharpInstance = sharp(buffer);
      
      // Test 1: Basic WebP conversion
      try {
        const basicWebp = await sharpInstance
          .webp({ quality: 80 })
          .toBuffer();
        
        diagnostics.webpTest = {
          basic: {
            success: true,
            size: basicWebp.length,
            compressionRatio: (buffer.length / basicWebp.length).toFixed(2)
          }
        };
      } catch (error) {
        diagnostics.webpTest = {
          basic: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
        diagnostics.recommendations.push('Basic WebP conversion failed');
      }
      
      // Test 2: WebP with resizing
      try {
        const resizedWebp = await sharp(buffer)
          .resize(800, 600, { fit: 'inside' })
          .webp({ quality: 85 })
          .toBuffer();
        
        if (diagnostics.webpTest) {
          diagnostics.webpTest.resized = {
            success: true,
            size: resizedWebp.length,
            compressionRatio: (buffer.length / resizedWebp.length).toFixed(2)
          };
        }
      } catch (error) {
        if (diagnostics.webpTest) {
          diagnostics.webpTest.resized = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        diagnostics.recommendations.push('WebP conversion with resizing failed');
      }
      
      // Test 3: WebP validation
      if (diagnostics.webpTest?.basic?.success) {
        try {
          const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
          const validationMetadata = await sharp(webpBuffer).metadata();
          
          if (diagnostics.webpTest) {
            diagnostics.webpTest.validation = {
              success: true,
              format: validationMetadata.format,
              isValidWebP: validationMetadata.format?.includes('webp') || false
            };
          }
        } catch (error) {
          if (diagnostics.webpTest) {
            diagnostics.webpTest.validation = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
          diagnostics.recommendations.push('WebP validation failed');
        }
      }
      
    } catch (error) {
      diagnostics.webpTest = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      diagnostics.recommendations.push('WebP conversion test failed completely');
    }
    
    // Generate recommendations based on results
    if (diagnostics.metadata?.width && diagnostics.metadata?.height) {
      const aspectRatio = diagnostics.metadata.width / diagnostics.metadata.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        diagnostics.recommendations.push('Unusual aspect ratio may cause conversion issues');
      }
    }
    
    if (diagnostics.fileInfo.size > 10 * 1024 * 1024) { // 10MB
      diagnostics.recommendations.push('Large file size may cause memory issues during conversion');
    }
    
    if (diagnostics.metadata?.format && !['jpeg', 'jpg', 'png', 'webp'].includes(diagnostics.metadata.format)) {
      diagnostics.recommendations.push(`Uncommon format '${diagnostics.metadata.format}' may not convert well to WebP`);
    }
    
    return NextResponse.json({
      success: true,
      diagnostics,
      summary: {
        totalIssues: diagnostics.recommendations.length,
        canConvert: diagnostics.webpTest?.basic?.success || false,
        needsResizing: diagnostics.recommendations.some(r => r.includes('large')),
        formatSupported: !diagnostics.recommendations.some(r => r.includes('format'))
      }
    });
    
  } catch (error) {
    console.error('❌ WebP diagnosis failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics: null
      },
      { status: 500 }
    );
  }
}
