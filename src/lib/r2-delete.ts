import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/**
 * Delete a single file from R2
 */
export async function deleteFileFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ Deleted file from R2: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete file from R2: ${key}`, error);
    return false;
  }
}

/**
 * Delete multiple files from R2
 */
export async function deleteFilesFromR2(keys: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const results = { deleted: 0, failed: 0, errors: [] as string[] };

  for (const key of keys) {
    try {
      const success = await deleteFileFromR2(key);
      if (success) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push(`Failed to delete: ${key}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error deleting ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

/**
 * Delete all files with a specific prefix from R2
 */
export async function deleteFilesByPrefix(prefix: string): Promise<{ deleted: number; failed: number; errors: string[] }> {
  try {
    // List all objects with the prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const listResponse = await r2Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length === 0) {
      console.log(`ℹ️ No files found with prefix: ${prefix}`);
      return { deleted: 0, failed: 0, errors: [] };
    }

    // Extract keys
    const keys = objects.map(obj => obj.Key!).filter(Boolean);
    console.log(`📋 Found ${keys.length} files to delete with prefix: ${prefix}`);

    // Delete all files
    return await deleteFilesFromR2(keys);
  } catch (error) {
    console.error(`❌ Failed to list/delete files with prefix ${prefix}:`, error);
    return { deleted: 0, failed: 0, errors: [`Failed to process prefix ${prefix}: ${error instanceof Error ? error.message : 'Unknown error'}`] };
  }
}

/**
 * Extract file key from R2 URL
 */
export function extractKeyFromR2Url(url: string): string | null {
  try {
    // Handle different R2 URL formats
    if (url.includes('r2.dev')) {
      // Format: https://bucket-name.r2.dev/path/to/file.jpg
      const urlParts = url.split('.r2.dev/');
      if (urlParts.length === 2) {
        return urlParts[1];
      }
    }
    
    if (url.includes('cloudflare.com')) {
      // Format: https://pub-xxx.r2.dev.cloudflare.com/path/to/file.jpg
      const urlParts = url.split('/');
      const keyIndex = urlParts.findIndex(part => part.includes('r2.dev.cloudflare.com'));
      if (keyIndex !== -1 && keyIndex + 1 < urlParts.length) {
        return urlParts.slice(keyIndex + 1).join('/');
      }
    }

    // Handle direct key format
    if (!url.includes('http')) {
      return url;
    }

    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', url, error);
    return null;
  }
}

/**
 * Delete property images from R2
 */
export async function deletePropertyImages(images: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const results = { deleted: 0, failed: 0, errors: [] as string[] };

  for (const imageUrl of images) {
    if (!imageUrl) continue;

    const key = extractKeyFromR2Url(imageUrl);
    if (!key) {
      results.failed++;
      results.errors.push(`Could not extract key from URL: ${imageUrl}`);
      continue;
    }

    try {
      const success = await deleteFileFromR2(key);
      if (success) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push(`Failed to delete: ${key}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Error deleting ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return results;
}

/**
 * Delete all files associated with a property
 */
export async function deletePropertyFiles(property: {
  thumbnailImage?: string;
  images?: string[];
}): Promise<{ deleted: number; failed: number; errors: string[] }> {
  const allImages = [];
  
  // Add thumbnail image
  if (property.thumbnailImage) {
    allImages.push(property.thumbnailImage);
  }
  
  // Add all property images
  if (property.images && Array.isArray(property.images)) {
    allImages.push(...property.images);
  }

  console.log(`🗑️ Deleting ${allImages.length} files for property`);
  
  return await deletePropertyImages(allImages);
}
