import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing file upload...');
    
    // Use Next.js built-in formData instead of formidable
    const formData = await request.formData();
    const files = formData.getAll('testFile') as File[];
    const fields = Object.fromEntries(formData.entries());
    console.log('Test upload - Fields:', fields);
    console.log('Test upload - Files:', files);
    
    // Handle file uploads
    const uploadedFiles: string[] = [];
    
    for (const file of files) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(file.name || 'test.jpg');
        const filename = `test_${timestamp}_${randomString}${extension}`;
        
        // Convert file to buffer and save
        const buffer = Buffer.from(await file.arrayBuffer());
        const destinationPath = path.join(uploadsDir, filename);
        await fs.writeFile(destinationPath, buffer);
        
        // Add public URL to files array
        uploadedFiles.push(`/uploads/${filename}`);
        
        console.log('Test file uploaded successfully:', filename);
      } catch (error) {
        console.error('Error processing test file upload:', error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test upload successful',
      uploadedFiles,
      fields: fields
    });
    
  } catch (error) {
    console.error('Error in test upload:', error);
    return NextResponse.json(
      { success: false, error: 'Test upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test upload endpoint is working. Use POST with multipart form data to test file uploads.' 
  });
}
