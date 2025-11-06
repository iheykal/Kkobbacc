import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Force dynamic rendering since this route uses request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/image-proxy
 * Proxy images from R2 to avoid CORS issues
 * Usage: /api/image-proxy?url=https://pub-126b4cc26d8041e99d7cc45ade6cfd3b.r2.dev/path/to/image.jpg
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

  // Validate that it's an R2 URL (accept any pub-*.r2.dev or *.r2.cloudflarestorage.com)
  const isR2 = /(^https?:\/\/)?([\w.-]*\.)?r2\.dev\//.test(imageUrl) || /(^https?:\/\/)?([\w.-]*\.)?r2\.cloudflarestorage\.com\//.test(imageUrl);
  if (!isR2) {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

    console.log('🖼️ Proxying image:', imageUrl);

    // Fetch the image from R2
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-Image-Proxy/1.0)'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Image proxied successfully:', {
      url: imageUrl,
      size: imageBuffer.byteLength,
      contentType
    });

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': '*',
      },
    });

  } catch (error: any) {
    console.error('❌ Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
