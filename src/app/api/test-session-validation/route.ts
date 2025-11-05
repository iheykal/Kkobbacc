import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing session validation...');
    
    // Use the session utility function
    const session = getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No valid session found",
        debug: {
          cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Session validation successful",
      session: {
        userId: session.userId,
        role: session.role,
        sessionId: session.sessionId,
        createdAt: session.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Session validation test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
