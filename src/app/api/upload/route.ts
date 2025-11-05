import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { processMultipleImages, processMultipleImagesSafe } from "@/lib/imageProcessor";

export async function POST(req: NextRequest) {
  try {
    console.log('📁 Starting local file upload...');
    
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const listingId = formData.get('listingId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    console.log(`📁 Uploading ${files.length} files locally...`);

    const uploadResults = [];

    // Process all images to WebP format with safe fallback
    console.log('🔄 Converting images to WebP format with safe fallback...');
    const processedImages = await processMultipleImagesSafe(files, {
      quality: 85, // High quality WebP
      width: 1920, // Max width for property images
      height: 1080, // Max height for property images
      fit: 'inside', // Maintain aspect ratio
      validateOutput: true, // Validate output
      fallbackToOriginal: true // Fallback to original format if WebP fails
    });

    for (let i = 0; i < processedImages.length; i++) {
      const processedImage = processedImages[i];
      const originalFile = files[i];
      
      try {
        // Create directory structure
        const baseDir = listingId ? `listings/${listingId}` : 'listings';
        const uploadDir = join(process.cwd(), 'public', 'uploads', baseDir);
        await mkdir(uploadDir, { recursive: true });
        
        // Save processed WebP file
        const filePath = join(uploadDir, processedImage.filename);
        await writeFile(filePath, processedImage.buffer);
        
        // Generate public URL
        const publicUrl = `/uploads/${baseDir}/${processedImage.filename}`;
        
        uploadResults.push({
          key: `${baseDir}/${processedImage.filename}`,
          url: publicUrl,
          filename: processedImage.filename,
          size: processedImage.buffer.length,
          type: processedImage.contentType,
          originalName: originalFile.name
        });

        console.log(`✅ Successfully uploaded ${originalFile.name} as WebP to ${publicUrl} (${processedImage.buffer.length} bytes)`);
      } catch (error) {
        console.error(`❌ Failed to upload ${originalFile.name}:`, error);
        return NextResponse.json({ 
          error: `Failed to upload ${originalFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

    console.log(`🎉 All ${uploadResults.length} files uploaded successfully`);
    
    return NextResponse.json({
      success: true,
      files: uploadResults
    });

  } catch (error) {
    console.error('❌ Local upload error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
