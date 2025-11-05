/**
 * API Route Optimizer
 * Reduces serverless function bundle size by lazy loading heavy dependencies
 */

// Lazy load heavy dependencies only when needed
export const lazyLoadMongoose = async () => {
  const mongoose = await import('mongoose');
  return mongoose.default;
};

export const lazyLoadBcryptjs = async () => {
  const bcryptjs = await import('bcryptjs');
  return bcryptjs.default;
};

export const lazyLoadAWS = async () => {
  const { S3Client } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  return { S3Client, getSignedUrl };
};

export const lazyLoadFormidable = async () => {
  const formidable = await import('formidable');
  return formidable.default;
};

// Optimized error handler
export const createErrorResponse = (message: string, status: number = 500) => {
  return new Response(JSON.stringify({ 
    success: false, 
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Optimized success response
export const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify({ 
    success: true, 
    data,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};