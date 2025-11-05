import { NextRequest, NextResponse } from 'next/server';
import { getCompanyLogoUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing company logo configuration...');
    
    // Test the getCompanyLogoUrl function
    const companyLogoUrl = getCompanyLogoUrl();
    
    // Check environment variables
    const envCheck = {
      ENABLE_COMPANY_LOGO: process.env.ENABLE_COMPANY_LOGO,
      COMPANY_LOGO_URL: process.env.COMPANY_LOGO_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('🔧 Environment variables:', envCheck);
    console.log('🏢 Company logo URL result:', companyLogoUrl);
    
    return NextResponse.json({
      success: true,
      companyLogoUrl,
      envCheck,
      message: companyLogoUrl ? 'Company logo is enabled' : 'Company logo is disabled'
    });
    
  } catch (error) {
    console.error('❌ Error testing company logo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test company logo configuration' },
      { status: 500 }
    );
  }
}
