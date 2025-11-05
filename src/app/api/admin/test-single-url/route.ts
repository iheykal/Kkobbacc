import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 });
    }

    console.log(`🔍 Testing URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'HEAD', // Just check if accessible, don't download
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const isAccessible = response.ok;
      
      // Get response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      console.log(`📊 URL test result: ${isAccessible ? 'accessible' : 'inaccessible'} (${response.status})`);

      return NextResponse.json({
        success: true,
        url: url,
        accessible: isAccessible,
        status: response.status,
        statusText: response.statusText,
        headers: headers,
        error: isAccessible ? null : `HTTP ${response.status}: ${response.statusText}`
      });

    } catch (error) {
      console.error(`❌ Error testing URL ${url}:`, error);
      
      return NextResponse.json({
        success: true,
        url: url,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Error in test-single-url API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test URL' },
      { status: 500 }
    );
  }
}
