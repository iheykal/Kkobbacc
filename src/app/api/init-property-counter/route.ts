import { NextRequest, NextResponse } from 'next/server';
import { initializePropertyCounter } from '@/lib/propertyIdGenerator';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Initializing property counter...');
    
    await initializePropertyCounter();
    
    console.log('✅ Property counter initialized successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Property counter initialized successfully' 
    });
  } catch (error) {
    console.error('💥 Error initializing property counter:', error);
    return NextResponse.json(
      { success: false, error: `Server error: ${error}` },
      { status: 500 }
    );
  }
}
