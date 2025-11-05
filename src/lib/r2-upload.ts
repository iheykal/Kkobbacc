'use client';

// NOTE: client-only helper that calls your server routes.
// DO NOT import '@aws-sdk/*' or 'crypto' here.

export async function uploadToR2(file: File, listingId?: string): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append('files', file);
  if (listingId) formData.append('listingId', listingId);

  const res = await fetch('/api/r2/upload', { method: 'POST', body: formData });
  const { success, files, error } = await res.json();

  if (error) throw new Error(error);
  if (!success || !files?.length) throw new Error('R2 upload failed - no files returned');

  const uploadedFile = files[0];
  return { key: uploadedFile.key, url: uploadedFile.url };
}

export async function uploadAgentAvatarToR2(file: File, agentId: string): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agentId', agentId);

  const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
  const { success, key, url, error } = await res.json();

  if (error) throw new Error(error);
  if (!success) throw new Error('R2 avatar upload failed');

  return { key, url };
}

export async function uploadMultipleToR2(files: File[], listingId?: string): Promise<{ key: string; url: string }[]> {
  return Promise.all(files.map((f) => uploadToR2(f, listingId)));
}

export async function uploadPropertyImagesToR2(files: File[], listingId?: string): Promise<{ key: string; url: string }[]> {
  console.log('📸 uploadPropertyImagesToR2 called with:', { filesCount: files.length, listingId });
  
  // Validate input files
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload');
  }
  
  // Validate each file
  for (const file of files) {
    if (!(file instanceof File)) {
      throw new Error('Invalid file object provided');
    }
    if (file.size === 0) {
      throw new Error(`File ${file.name} is empty`);
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error(`File ${file.name} is too large (max 10MB)`);
    }
  }
  
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (listingId) formData.append('listingId', listingId);

  console.log('📸 Making request to /api/properties/upload-images');
  const res = await fetch('/api/properties/upload-images', { method: 'POST', body: formData, credentials: 'include' });
  
  console.log('📸 Upload response status:', res.status, res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('📸 Upload failed with status:', res.status, errorText);
    throw new Error(`Upload failed with status ${res.status}: ${errorText}`);
  }
  
  const responseData = await res.json();
  console.log('📸 Upload response data:', responseData);
  
  const { success, files: uploadedFiles, error } = responseData;

  if (error) {
    console.error('📸 Upload error:', error);
    throw new Error(error);
  }
  if (!success || !uploadedFiles?.length) {
    console.error('📸 Upload failed - no files returned:', { success, uploadedFiles });
    throw new Error('Property image upload failed');
  }

  // Validate returned URLs
  for (const file of uploadedFiles) {
    if (!file.url || typeof file.url !== 'string') {
      console.error('📸 Invalid URL returned:', file);
      throw new Error('Invalid URL returned from upload service');
    }
    
    // Basic URL validation
    try {
      new URL(file.url);
    } catch (e) {
      console.error('📸 Invalid URL format:', file.url);
      throw new Error(`Invalid URL format: ${file.url}`);
    }
  }

  console.log('📸 Upload successful, returning:', uploadedFiles);
  return uploadedFiles;
}