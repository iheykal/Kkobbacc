import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing upload endpoints...');
    
    // Test R2 upload endpoint
    console.log('📤 Testing /api/r2/upload endpoint...');
    try {
      const r2Response = await fetch('http://localhost:3000/api/r2/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true })
      });
      
      const r2Text = await r2Response.text();
      console.log('📥 R2 upload response status:', r2Response.status);
      console.log('📥 R2 upload response text:', r2Text);
      
      return NextResponse.json({
        success: true,
        r2Upload: {
          status: r2Response.status,
          text: r2Text,
          headers: Object.fromEntries(r2Response.headers.entries())
        }
      });
      
    } catch (error) {
      console.error('❌ Error testing R2 upload:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to test R2 upload endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed'
    }, { status: 500 });
  }
}
