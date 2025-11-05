import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Debug API: Request received');
    
    const { searchParams } = new URL(request.url);
    const testParam = searchParams.get('test');
    
    console.log('🔍 Test Debug API: Test param:', testParam);
    
    return NextResponse.json({
      success: true,
      message: 'Test debug API is working',
      timestamp: new Date().toISOString(),
      testParam: testParam,
      url: request.url
    });
    
  } catch (error: any) {
    console.error('❌ Test Debug API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Test debug API failed' },
      { status: 500 }
    );
  }
}

