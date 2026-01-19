/**
 * Fixed Property Image Upload Route
 * 
 * This version fixes the common suspects for "same image showing" issue:
 * 1. Unique key generation per file
 * 2. Proper file processing isolation
 * 3. Cache busting headers
 * 4. Better error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSessionFromRequest } from "@/lib/sessionUtils";
import { isAllowed } from "@/lib/authz/authorize";
import { processImageFileSafe } from "@/lib/imageProcessor";
import { generateUniqueKey, generateUniqueKeys } from "@/lib/uniqueKeyGenerator";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('📸 Property image upload request received');

    // Environment validation
    const requiredEnvVars = [
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required R2 environment variables:', missingVars);
      return NextResponse.json({
        success: false,
        error: `Missing environment variables: ${missingVars.join(', ')}`
      }, { status: 500 });
    }

    // Authentication check
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
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

    // Parse form data
    const form = await req.formData();
    const files = form.getAll('files') as File[];
    const listingId = form.get('listingId') as string;

    console.log('📸 Form data parsed:', {
      filesCount: files.length,
      listingId: listingId,
      fileNames: files.map(f => f.name)
    });

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No files provided"
      }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      if (!(file instanceof File)) {
        return NextResponse.json({
          success: false,
          error: "Invalid file object"
        }, { status: 400 });
      }

      if (file.size === 0) {
        return NextResponse.json({
          success: false,
          error: `File ${file.name} is empty`
        }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json({
          success: false,
          error: `File ${file.name} is too large (max 10MB)`
        }, { status: 400 });
      }
    }

    // Create S3 client
    const s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const bucket = process.env.R2_BUCKET!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || '';

    // Generate unique upload session ID
    const uploadSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const directory = `properties/${uploadSessionId}`;

    console.log('📸 Starting parallel file processing for', files.length, 'files');

    // Process all files in parallel to prevent shared state issues
    const uploadPromises = files.map(async (file, index) => {
      try {
        console.log(`📸 Processing file ${index + 1}/${files.length}: ${file.name}`);

        let processedFile: { buffer: Buffer; filename: string; contentType: string };

        // Process image files
        if (file.type.startsWith('image/')) {
          console.log(`📸 Converting image ${file.name} to WebP format...`);

          try {
            processedFile = await processImageFileSafe(file, {
              quality: 85,
              width: 1920,
              height: 1080,
              fit: 'inside',
              validateOutput: true,
              fallbackToOriginal: true
            });

            console.log(`✅ WebP conversion successful for ${file.name}`);
          } catch (error) {
            console.error(`❌ WebP conversion failed for ${file.name}, using original:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              fileType: file.type,
              fileSize: file.size
            });

            // Fallback to original format
            const bytes = await file.arrayBuffer();
            processedFile = {
              buffer: Buffer.from(bytes),
              filename: file.name,
              contentType: file.type || 'application/octet-stream'
            };
          }
        } else {
          // Non-image files
          console.log(`📄 Processing non-image file: ${file.name}`);
          const bytes = await file.arrayBuffer();
          processedFile = {
            buffer: Buffer.from(bytes),
            filename: file.name,
            contentType: file.type || 'application/octet-stream'
          };
        }

        // Generate unique key for this specific file
        const key = generateUniqueKey(directory, processedFile.filename);
        console.log(`📸 Generated unique key for ${file.name}: ${key}`);

        // Upload to R2 with cache headers
        const uploadCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: processedFile.buffer,
          ContentType: processedFile.contentType,
          CacheControl: 'public, max-age=31536000, immutable', // 1 year cache for immutable content
          Metadata: {
            'original-filename': file.name,
            'upload-timestamp': Date.now().toString(),
            'file-index': index.toString(),
            'session-id': uploadSessionId
          }
        });

        console.log(`📤 Uploading ${file.name} to R2 with key: ${key}`);
        await s3.send(uploadCommand);
        console.log(`✅ Successfully uploaded ${file.name} to R2`);

        // Generate public URL
        let url: string;
        if (publicBase && publicBase.trim() !== '') {
          const cleanPublicBase = publicBase.replace(/\/$/, '').trim();
          url = cleanPublicBase.startsWith('http')
            ? `${cleanPublicBase}/${key}`
            : `https://${cleanPublicBase}/${key}`;
        } else {
          url = `https://${bucket}.r2.dev/${key}`;
        }

        // Add cache busting parameter
        const cacheBuster = `?v=${Date.now()}`;
        url += cacheBuster;

        console.log(`📸 Generated URL for ${file.name}: ${url}`);

        return {
          key,
          url,
          originalName: file.name,
          size: processedFile.buffer.length,
          contentType: processedFile.contentType,
          index
        };

      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Wait for all uploads to complete
    console.log('📸 Waiting for all uploads to complete...');
    const results = await Promise.all(uploadPromises);

    console.log(`🎉 Successfully uploaded ${results.length} files to R2`);
    console.log('📸 Upload results:', results.map(r => ({
      originalName: r.originalName,
      key: r.key,
      url: r.url,
      size: r.size
    })));

    // Validate that all URLs are unique
    const urls = results.map(r => r.url);
    const uniqueUrls = new Set(urls);

    if (uniqueUrls.size !== urls.length) {
      console.error('❌ CRITICAL: Duplicate URLs detected!');
      console.error('URLs:', urls);
      return NextResponse.json({
        success: false,
        error: 'Duplicate URLs generated - this indicates a key collision issue'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      files: results,
      message: `Successfully uploaded ${results.length} images to Cloudflare R2`,
      uploadSessionId,
      summary: {
        totalFiles: results.length,
        totalSize: results.reduce((sum, r) => sum + r.size, 0),
        uniqueUrls: uniqueUrls.size,
        allUrlsUnique: uniqueUrls.size === urls.length
      }
    });

  } catch (error: any) {
    console.error('❌ Property image upload error:', error);
    console.error('❌ Error stack:', error?.stack);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}




