/**
 * Unique Key Generator for R2 Uploads
 * 
 * Prevents key collisions by ensuring each upload gets a unique identifier
 */

import crypto from 'crypto';

/**
 * Sanitizes filename for safe use in object keys
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w.-]/g, '_')  // Replace special chars with underscore
    .replace(/_{2,}/g, '_')    // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')    // Remove leading/trailing underscores
    .toLowerCase();            // Convert to lowercase
}

/**
 * Generates a unique key for R2 uploads
 * Format: {directory}/{timestamp}-{uuid}-{sanitized-filename}
 */
export function generateUniqueKey(
  directory: string,
  originalFilename: string,
  extension?: string
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFilename(originalFilename);
  
  // Use provided extension or extract from original filename
  const fileExtension = extension || originalFilename.split('.').pop() || 'webp';
  
  return `${directory}/${timestamp}-${uuid}-${sanitized}.${fileExtension}`;
}

/**
 * Generates unique keys for multiple files
 */
export function generateUniqueKeys(
  directory: string,
  files: Array<{ name: string; type?: string }>
): string[] {
  return files.map(file => {
    const extension = file.type?.startsWith('image/') ? 'webp' : 
                     file.name.split('.').pop() || 'bin';
    return generateUniqueKey(directory, file.name, extension);
  });
}

/**
 * Validates that a key is properly formatted
 */
export function validateKey(key: string): boolean {
  const keyPattern = /^[a-zA-Z0-9\/\-_.]+$/;
  return keyPattern.test(key) && key.length > 0 && key.length < 1024;
}

/**
 * Extracts metadata from a key
 */
export function parseKey(key: string): {
  directory: string;
  timestamp: number;
  uuid: string;
  filename: string;
  extension: string;
} | null {
  const parts = key.split('/');
  if (parts.length < 2) return null;
  
  const directory = parts.slice(0, -1).join('/');
  const filename = parts[parts.length - 1];
  
  const filenameParts = filename.split('-');
  if (filenameParts.length < 3) return null;
  
  const timestamp = parseInt(filenameParts[0]);
  const uuid = filenameParts[1];
  const originalFilename = filenameParts.slice(2).join('-');
  const extension = originalFilename.split('.').pop() || '';
  
  return {
    directory,
    timestamp,
    uuid,
    filename: originalFilename,
    extension
  };
}




