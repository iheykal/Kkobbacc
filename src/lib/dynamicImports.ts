// Dynamic imports to reduce bundle size and avoid serverless function size limits

// Cache for dynamic imports to avoid repeated loading
const importCache = new Map<string, any>();

/**
 * Dynamically import mongoose with caching
 */
export async function getMongoose() {
  if (importCache.has('mongoose')) {
    return importCache.get('mongoose');
  }

  const mongooseModule = await import('mongoose');
  const mongoose = mongooseModule.default || mongooseModule;
  importCache.set('mongoose', mongoose);
  return mongoose;
}

/**
 * Dynamically import bcryptjs with caching
 */
export async function getBcryptjs() {
  if (importCache.has('bcryptjs')) {
    return importCache.get('bcryptjs');
  }

  const bcryptjsModule = await import('bcryptjs');
  const bcryptjs = bcryptjsModule.default || bcryptjsModule;
  importCache.set('bcryptjs', bcryptjs);
  return bcryptjs;
}

/**
 * Dynamically import AWS S3 client with caching
 */
export async function getS3Client() {
  if (importCache.has('s3-client')) {
    return importCache.get('s3-client');
  }

  const { S3Client } = await import('@aws-sdk/client-s3');
  importCache.set('s3-client', { S3Client });
  return { S3Client };
}

/**
 * Dynamically import AWS S3 request presigner with caching
 */
export async function getS3RequestPresigner() {
  if (importCache.has('s3-presigner')) {
    return importCache.get('s3-presigner');
  }

  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  importCache.set('s3-presigner', { getSignedUrl });
  return { getSignedUrl };
}

/**
 * Dynamically import formidable with caching
 */
export async function getFormidable() {
  if (importCache.has('formidable')) {
    return importCache.get('formidable');
  }

  const formidableModule = await import('formidable');
  const formidable = formidableModule.default || formidableModule;
  importCache.set('formidable', formidable);
  return formidable;
}

/**
 * Dynamically import sharp with caching
 */
export async function getSharp() {
  if (importCache.has('sharp')) {
    return importCache.get('sharp');
  }

  const sharpModule = await import('sharp');
  const sharp = sharpModule.default || sharpModule;
  importCache.set('sharp', sharp);
  return sharp;
}

/**
 * Clear import cache (useful for testing or memory management)
 */
export function clearImportCache() {
  importCache.clear();
}

/**
 * Get cache size for monitoring
 */
export function getCacheSize() {
  return importCache.size;
}