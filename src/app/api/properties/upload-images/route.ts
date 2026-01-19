import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import { processImageFileSafe } from '@/lib/imageProcessor';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('📸 Property image upload request received');
    console.log('🔍 Environment check at start:', {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? 'SET' : 'NOT SET',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      R2_BUCKET: process.env.R2_BUCKET ? 'SET' : 'NOT SET',
      R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL ? 'SET' : 'NOT SET'
    });

    // Check if we have the required environment variables
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) {
      console.error('❌ Missing required R2 environment variables');
      return NextResponse.json({
        success: false,
        error: 'R2 configuration missing. Please check environment variables.'
      }, { status: 500 });
    }

    console.log('✅ All required R2 environment variables are present');

    // Get session for authorization
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization for creating properties
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'create',
      resource: 'property',
      ownerId: session.userId
    });

    if (!authResult.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: insufficient permissions'
      }, { status: 403 });
    }

    const form = await req.formData();
    const files = form.getAll('files') as File[];
    let listingId = form.get('listingId') as string;

    console.log('📸 Form data parsed:', {
      filesCount: files.length,
      listingId: listingId,
      filesInfo: files.map(f => f instanceof File ? { name: f.name, size: f.size, type: f.type } : { name: 'unknown', size: 0, type: 'unknown' })
    });

    // Generate a unique identifier for this upload session if no listingId is provided
    const uploadSessionId = listingId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('📸 Upload session ID:', uploadSessionId);

    if (!files.length) {
      console.error('❌ No files provided in request');
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    console.log(`📸 Uploading ${files.length} files to R2 for listing: ${listingId || 'general'}`);
    console.log('📸 Files to upload:', files.map(f => f instanceof File ? { name: f.name, size: f.size, type: f.type } : { name: 'unknown', size: 0, type: 'unknown' }));

    // dynamic import to keep bundle small
    console.log('📸 Starting dynamic imports...');
    const [{ S3Client, PutObjectCommand }] = await Promise.all([
      import('@aws-sdk/client-s3'),
    ]);
    console.log('✅ S3Client imported successfully');

    // Check R2 environment variables
    const missingEnvVars = [];
    if (!process.env.R2_ENDPOINT) missingEnvVars.push('R2_ENDPOINT');
    if (!process.env.R2_ACCESS_KEY_ID) missingEnvVars.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingEnvVars.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_BUCKET) missingEnvVars.push('R2_BUCKET');

    if (missingEnvVars.length > 0) {
      console.error('❌ Missing R2 environment variables:', missingEnvVars);
      return NextResponse.json({
        success: false,
        error: `R2 configuration missing: ${missingEnvVars.join(', ')}. Please configure R2 environment variables in Render dashboard.`
      }, { status: 500 });
    }

    console.log('✅ All R2 environment variables are present');

    // Extract the actual endpoint URL from the environment variable
    let r2Endpoint = process.env.R2_ENDPOINT!;

    console.log('🔍 Raw R2_ENDPOINT:', r2Endpoint);

    // Handle case where the environment variable contains key=value format
    if (r2Endpoint.includes('R2_ENDPOINT=')) {
      r2Endpoint = r2Endpoint.split('R2_ENDPOINT=')[1];
      console.log('🔍 Extracted from R2_ENDPOINT= format:', r2Endpoint);
    } else if (r2Endpoint.includes('r2_endpoint=')) {
      r2Endpoint = r2Endpoint.split('r2_endpoint=')[1];
      console.log('🔍 Extracted from r2_endpoint= format:', r2Endpoint);
    }

    // If the endpoint contains the full URL, extract just the hostname
    if (r2Endpoint.includes('https://')) {
      r2Endpoint = r2Endpoint.replace('https://', '');
    }
    if (r2Endpoint.includes('http://')) {
      r2Endpoint = r2Endpoint.replace('http://', '');
    }

    console.log('🔍 R2 Endpoint processing:', {
      original: process.env.R2_ENDPOINT,
      processed: r2Endpoint
    });

    // Validate the processed endpoint
    if (!r2Endpoint || r2Endpoint.trim() === '') {
      throw new Error('R2_ENDPOINT is empty after processing');
    }

    // Ensure the endpoint doesn't contain any invalid characters
    if (r2Endpoint.includes('=') || r2Endpoint.includes(' ')) {
      throw new Error(`Invalid R2_ENDPOINT format after processing: ${r2Endpoint}. Original: ${process.env.R2_ENDPOINT}`);
    }

    const finalEndpoint = `https://${r2Endpoint}`;
    console.log('🔍 Final S3 endpoint:', finalEndpoint);

    const s3 = new S3Client({
      region: 'auto',
      endpoint: finalEndpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    console.log('✅ S3 client created successfully');

    const bucket = (process.env.R2_BUCKET || '').trim();
    if (!bucket) {
      return NextResponse.json({ success: false, error: 'R2_BUCKET is empty after trimming' }, { status: 500 });
    }

    // Early check that bucket exists and is accessible
    try {
      const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log('✅ HeadBucket successful for', bucket);
    } catch (e: any) {
      console.error('❌ HeadBucket failed for', bucket, e);
      // Extra diagnostics: list buckets and include error metadata in response
      try {
        const { ListBucketsCommand } = await import('@aws-sdk/client-s3');
        const lb = await s3.send(new ListBucketsCommand({}));
        const names = (lb.Buckets || []).map((b: any) => b.Name);
        console.error('🧪 Visible buckets from current credentials:', names);
        return NextResponse.json(
          {
            success: false,
            error: `Bucket check failed for "${bucket}": ${e?.message || 'UnknownError'}`,
            details: {
              errorName: e?.name,
              errorCode: e?.code,
              httpStatus: e?.$metadata?.httpStatusCode,
              visibleBuckets: names
            }
          },
          { status: 500 }
        );
      } catch (e2: any) {
        console.error('❌ ListBuckets also failed:', e2);
        return NextResponse.json(
          {
            success: false,
            error: `Bucket check failed for "${bucket}": ${e?.message || 'UnknownError'}`,
            details: {
              errorName: e?.name,
              errorCode: e?.code,
              httpStatus: e?.$metadata?.httpStatusCode,
              listBucketsError: e2?.message || 'UnknownError'
            }
          },
          { status: 500 }
        );
      }
    }
    const publicBase = process.env.R2_PUBLIC_BASE_URL || '';

    console.log('🔍 R2 Configuration Debug:', {
      bucket: bucket,
      publicBase: publicBase,
      r2Endpoint: process.env.R2_ENDPOINT,
      hasPublicBase: !!publicBase,
      publicBaseLength: publicBase.length,
      bucketLength: bucket.length,
      allEnvVars: {
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
        R2_BUCKET: process.env.R2_BUCKET,
        R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL
      }
    });

    const results: Array<{ key: string; url: string }> = [];

    // Test URL generation before processing files
    const testKey = 'test-key';
    let testUrl: string = '';
    try {
      if (publicBase && publicBase.trim() !== '') {
        const cleanPublicBase = publicBase.replace(/\/$/, '').trim();
        if (cleanPublicBase.startsWith('http://') || cleanPublicBase.startsWith('https://')) {
          testUrl = `${cleanPublicBase}/${testKey}`;
        } else {
          testUrl = `https://${cleanPublicBase}/${testKey}`;
        }
      } else {
        testUrl = `https://${bucket}.r2.dev/${testKey}`;
      }

      if (!testUrl || testUrl.trim() === '') {
        throw new Error('Test URL is empty');
      }

      new URL(testUrl);
      console.log('✅ Test URL generation successful:', testUrl);
    } catch (testError) {
      console.error('❌ Test URL generation failed:', {
        publicBase,
        bucket,
        testKey,
        testUrl,
        error: testError
      });
      throw new Error(`URL generation test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
    }

    console.log('📸 Starting file processing loop for', files.length, 'files');

    for (const f of files) {
      try {
        console.log('📸 Processing file:', f instanceof File ? f.name : 'unknown');
        if (!(f instanceof File)) {
          console.log('⚠️ Skipping non-File object');
          continue;
        }

        // Type assertion since we've confirmed it's a File
        const file = f as File;
        console.log(`🔄 Processing property image: ${file.name} (${file.type})`);

        let processedFile: { buffer: Buffer; filename: string; contentType: string };

        // Check if it's an image file
        console.log('📸 File type check:', { type: file.type, isImage: file.type.startsWith('image/') });

        if (file.type.startsWith('image/')) {
          console.log('📸 Converting property image to WebP format...');
          try {
            processedFile = await processImageFileSafe(file, {
              quality: 85, // Good balance of quality and file size for property images
              width: 1920, // Max width for web display
              height: 1080, // Max height for web display
              fit: 'inside', // Maintain aspect ratio
              validateOutput: true, // Ensure WebP conversion is valid
              fallbackToOriginal: true // Allow fallback to original format if WebP conversion fails
            });
            console.log(`✅ WebP conversion successful: ${processedFile.filename}`);
          } catch (error) {
            console.error('❌ WebP conversion failed - using original format:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            });
            // Use original format if WebP conversion fails
            const bytes = await file.arrayBuffer();
            processedFile = {
              buffer: Buffer.from(bytes),
              filename: sanitizeName(file.name),
              contentType: file.type || 'application/octet-stream'
            };
            console.log('✅ Using original format as fallback');
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
          console.log('✅ Non-image file processed successfully');
        }

        // Create a unique key for each upload
        console.log('📸 Generating unique key for file:', processedFile.filename);
        const key = `properties/${uploadSessionId}/${cryptoRandom(8)}-${Date.now()}-${sanitizeName(processedFile.filename)}`;
        console.log('📸 Generated key:', key);

        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: processedFile.buffer,
          ContentType: processedFile.contentType,
        });

        console.log('📸 Uploading to R2:', {
          bucket: bucket,
          key: key,
          contentType: processedFile.contentType,
          bufferSize: processedFile.buffer.length
        });

        await s3.send(cmd);
        console.log('✅ File uploaded to R2 successfully:', key);

        // Generate correct R2 public URL format: https://bucket-name.r2.dev/key
        let url: string = '';

        console.log('📸 Starting URL generation for key:', key);
        console.log('📸 URL generation inputs:', {
          publicBase: publicBase,
          bucket: bucket,
          key: key,
          hasPublicBase: !!publicBase,
          publicBaseLength: publicBase?.length || 0
        });

        try {
          // More robust URL generation with validation
          if (publicBase && publicBase.trim() !== '') {
            console.log('📸 Using publicBase for URL generation');
            // Remove trailing slash from publicBase and add key
            const cleanPublicBase = publicBase.replace(/\/$/, '').trim();
            console.log('📸 Clean publicBase:', cleanPublicBase);

            if (cleanPublicBase.startsWith('http://') || cleanPublicBase.startsWith('https://')) {
              url = `${cleanPublicBase}/${key}`;
              console.log('📸 URL with protocol:', url);
            } else {
              // If publicBase doesn't start with http, prepend https://
              url = `https://${cleanPublicBase}/${key}`;
              console.log('📸 URL with added protocol:', url);
            }
          } else {
            console.log('📸 Using fallback R2 URL format');
            // Fallback to standard R2 URL format
            url = `https://${bucket}.r2.dev/${key}`;
            console.log('📸 Fallback URL:', url);
          }

          // Additional validation
          if (!url || url.trim() === '') {
            throw new Error('Generated URL is empty');
          }

          console.log('📸 Final URL before validation:', url);

          // Validate the URL before adding to results
          new URL(url); // This will throw if URL is invalid
          console.log('✅ URL validation successful');

          results.push({ key, url });

          console.log(`✅ Uploaded: ${key} -> ${url}`);
          console.log(`🔍 URL Debug:`, {
            publicBase: publicBase,
            r2Endpoint: process.env.R2_ENDPOINT,
            bucket: bucket,
            key: key,
            finalUrl: url,
            urlFormat: 'https://bucket-name.r2.dev/key',
            urlValid: true
          });
        } catch (urlError) {
          console.error('❌ Invalid URL generated:', {
            publicBase,
            bucket,
            key,
            error: urlError,
            generatedUrl: url,
            errorMessage: urlError instanceof Error ? urlError.message : 'Unknown error',
            errorStack: urlError instanceof Error ? urlError.stack : undefined
          });
          throw new Error(`Invalid URL generated: ${urlError instanceof Error ? urlError.message : 'Unknown URL error'}`);
        }
      } catch (fileError) {
        console.error('❌ Error processing file:', fileError);
        throw new Error(`File processing failed: ${fileError instanceof Error ? fileError.message : 'Unknown file error'}`);
      }
    }

    console.log(`🎉 Successfully uploaded ${results.length} files to R2 with WebP conversion`);
    console.log('📸 Final upload results:', results.map(r => ({ key: r.key, url: r.url })));

    // Persist uploaded URLs to property document if listingId is provided
    if (listingId && results.length > 0) {
      try {
        console.log('📸 Persisting uploaded URLs to property document:', listingId);
        await connectToDatabase();

        const urls = results.map(r => r.url);

        // Find property by _id first (if it's a MongoDB ObjectId), then by propertyId
        let property = null;

        // Check if listingId is a MongoDB ObjectId (24 hex characters)
        if (/^[0-9a-fA-F]{24}$/.test(listingId)) {
          console.log('📸 Searching by MongoDB _id:', listingId);
          property = await Property.findById(listingId);
        }

        // If not found by _id, try by propertyId
        if (!property) {
          console.log('📸 Searching by propertyId:', listingId);
          property = await Property.findOne({ propertyId: Number(listingId) });
        }

        if (property) {
          console.log('📸 Found property, updating images:', {
            propertyId: property.propertyId,
            currentImages: property.images?.length || 0,
            newUrls: urls.length
          });

          // Set thumbnail if empty, and append to images (dedupe)
          if (!property.thumbnailImage && urls.length > 0) {
            property.thumbnailImage = urls[0];
            console.log('📸 Set thumbnail image:', urls[0]);
          }

          // Merge with existing images and deduplicate
          const existingImages = property.images || [];
          const imageSet = new Set([...existingImages, ...urls]);
          property.images = Array.from(imageSet);

          await property.save();
          console.log('✅ Property images updated successfully:', {
            totalImages: property.images.length,
            thumbnailSet: !!property.thumbnailImage
          });
        } else {
          console.warn('⚠️ listingId provided but property not found:', listingId);
        }
      } catch (persistError) {
        console.error('❌ Error persisting images to property:', persistError);
        // Don't fail the upload if persistence fails - the files are still uploaded
      }
    } else if (!listingId) {
      console.log('📸 No listingId provided - URLs returned but not persisted to property');
    }

    return NextResponse.json({
      success: true,
      files: results,
      message: `Successfully uploaded ${results.length} images to Cloudflare R2 with WebP optimization`,
      persisted: !!(listingId && results.length > 0)
    });

  } catch (err: any) {
    console.error('❌ Property image upload error:', err);
    console.error('❌ Error stack:', err?.stack);
    console.error('❌ Error details:', {
      message: err?.message,
      name: err?.name,
      cause: err?.cause,
      code: err?.code
    });
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function sanitizeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

function cryptoRandom(len: number) {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(len);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len * 2);
  }
}

