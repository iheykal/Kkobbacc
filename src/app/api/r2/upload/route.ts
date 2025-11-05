// Node runtime is required for AWS SDK
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    console.log('📸 R2 upload request received');
    
    const form = await req.formData();
    const files = form.getAll('files');
    const listingId = form.get('listingId') as string;

    if (!files.length) {
      return Response.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    console.log(`📸 Uploading ${files.length} files to R2 for listing: ${listingId || 'general'}`);
    console.log('📸 Files to upload:', files.map(f => f instanceof File ? { name: f.name, size: f.size, type: f.type } : { name: 'unknown', size: 0, type: 'unknown' }));

    // dynamic import to keep bundle small
    const [{ S3Client, PutObjectCommand }] = await Promise.all([
      import('@aws-sdk/client-s3'),
    ]);

    const { getR2Endpoint } = await import('@/lib/getR2Endpoint')
    const s3 = new S3Client({
      region: 'auto',
      endpoint: getR2Endpoint(), // normalized endpoint
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    const bucket = process.env.R2_BUCKET!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || ''; // e.g. https://cdn.example.com or https://<bucket>.<accountid>.r2.dev

    const results: Array<{ key: string; url: string }> = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;
      
      // Type assertion since we've confirmed it's a File
      const file = f as File;
      console.log(`🔄 Processing file: ${file.name} (${file.type})`);
      
      let processedFile: { buffer: Buffer; filename: string; contentType: string };
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        console.log('📸 Converting image to WebP format...');
        try {
          // Import the image processor
          const { processImageFileSafe } = await import('@/lib/imageProcessor');
          
          processedFile = await processImageFileSafe(file, {
            quality: 85, // Good balance of quality and file size
            width: 1920, // Max width for web display
            height: 1080, // Max height for web display
            fit: 'inside', // Maintain aspect ratio
            validateOutput: true, // Ensure WebP conversion is valid
            fallbackToOriginal: false // Force WebP conversion
          });
          console.log(`✅ WebP conversion successful: ${processedFile.filename}`);
        } catch (error) {
          console.error('❌ WebP conversion failed - rejecting upload:', error);
          // Reject the upload if WebP conversion fails
          return Response.json({ 
            success: false, 
            error: `WebP conversion failed for ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }, { status: 400 });
        }
      } else {
        // For non-image files, use original
        console.log('📄 Non-image file, using original format');
        const bytes = await file.arrayBuffer();
        processedFile = {
          buffer: Buffer.from(bytes),
          filename: sanitizeName(file.name),
          contentType: file.type || 'application/octet-stream'
        };
      }
      
      // Create organized directory structure - match the property upload route
      const baseDir = listingId ? `kobac-real-estate/uploads/listings/${listingId}` : 'kobac-real-estate/uploads';
      const timestamp = Date.now();
      const randomId = cryptoRandom(8);
      const key = `${baseDir}/${timestamp}-${randomId}-${processedFile.filename}`;

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: processedFile.buffer,
        ContentType: processedFile.contentType,
      });

      await s3.send(cmd);

      // Generate correct R2 public URL format: https://bucket-name.r2.dev/key
      const url = publicBase
        ? `${publicBase.replace(/\/$/, '')}/${key}`
        : `https://${bucket}.r2.dev/${key}`;

      results.push({ key, url });
      
      console.log(`✅ Uploaded: ${key} -> ${url}`);
    }

    console.log(`🎉 Successfully uploaded ${results.length} files to R2 with WebP conversion`);
    console.log('📸 Final upload results:', results.map(r => ({ key: r.key, url: r.url })));

    return Response.json({ 
      success: true, 
      files: results,
      message: `Successfully uploaded ${results.length} images to Cloudflare R2 with WebP optimization`
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// tiny helpers (stay here: server-only)
function sanitizeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

function cryptoRandom(len: number) {
  // avoid importing 'crypto' globally; use globalThis.crypto if available, otherwise node:crypto
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(len);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len * 2);
  }
}