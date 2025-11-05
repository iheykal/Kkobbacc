import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { imagePath, quality = 85 } = await request.json();
    
    if (!imagePath) {
      return NextResponse.json(
        { success: false, error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Validate file path (security check)
    const fullPath = path.resolve(imagePath);
    const publicPath = path.resolve('public');
    
    if (!fullPath.startsWith(publicPath)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file info
    const fileStats = fs.statSync(fullPath);
    const parsedPath = path.parse(fullPath);
    
    // Check if it's already WebP
    if (parsedPath.ext.toLowerCase() === '.webp') {
      return NextResponse.json({
        success: true,
        message: 'File is already WebP format',
        originalPath: imagePath,
        webpPath: imagePath,
        size: {
          original: fileStats.size,
          webp: fileStats.size
        }
      });
    }

    // Create WebP path
    const webpPath = path.join(parsedPath.dir, `${parsedPath.name}.webp`);
    
    // Convert to WebP
    await sharp(fullPath)
      .webp({ quality })
      .toFile(webpPath);

    // Get WebP file stats
    const webpStats = fs.statSync(webpPath);
    const savings = ((fileStats.size - webpStats.size) / fileStats.size * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      message: 'Image converted to WebP successfully',
      originalPath: imagePath,
      webpPath: path.relative(process.cwd(), webpPath),
      size: {
        original: fileStats.size,
        webp: webpStats.size,
        savings: `${savings}%`
      }
    });

  } catch (error) {
    console.error('WebP conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Conversion failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WebP Conversion API',
    usage: 'POST with { imagePath: string, quality?: number }',
    example: {
      imagePath: 'public/icons/example.png',
      quality: 85
    }
  });
}
