import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/sessionUtils";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing session fix...');
    
    // Get all cookies for debugging
    const allCookies = request.cookies.getAll();
    console.log('🍪 All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Check both session cookies
    const kobacSession = request.cookies.get('kobac_session')?.value;
    const kobacSessionAlt = request.cookies.get('kobac_session_alt')?.value;
    
    console.log('🍪 kobac_session found:', !!kobacSession);
    console.log('🍪 kobac_session_alt found:', !!kobacSessionAlt);
    
    // Try to parse the main session cookie
    let sessionData = null;
    let parseError = null;
    
    if (kobacSession) {
      try {
        const decoded = decodeURIComponent(kobacSession);
        console.log('🔓 Decoded session:', decoded);
        sessionData = JSON.parse(decoded);
        console.log('📋 Parsed session:', sessionData);
      } catch (error) {
        parseError = error;
        console.log('❌ Failed to parse kobac_session:', error);
      }
    }
    
    // Try the alternative session cookie if main one failed
    if (!sessionData && kobacSessionAlt) {
      try {
        const decoded = decodeURIComponent(kobacSessionAlt);
        console.log('🔓 Decoded alt session:', decoded);
        sessionData = JSON.parse(decoded);
        console.log('📋 Parsed alt session:', sessionData);
      } catch (error) {
        console.log('❌ Failed to parse kobac_session_alt:', error);
      }
    }
    
    // Use the session utility function
    const validatedSession = getSessionFromRequest(request);
    console.log('✅ Validated session:', validatedSession);
    
    if (!validatedSession) {
      return NextResponse.json({
        success: false,
        error: "No session found",
        debug: {
          cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
          kobacSession: kobacSession ? 'present' : 'missing',
          kobacSessionAlt: kobacSessionAlt ? 'present' : 'missing',
          parseError: (parseError as any)?.message || null,
          rawSessionData: sessionData,
          validationFailed: true
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      session: validatedSession,
      debug: {
        cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
        kobacSession: kobacSession ? 'present' : 'missing',
        kobacSessionAlt: kobacSessionAlt ? 'present' : 'missing',
        rawSessionData: sessionData,
        validatedSession: validatedSession
      }
    });
    
  } catch (error) {
    console.error('❌ Session fix test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        error: error instanceof Error ? error.stack : String(error)
      }
    }, { status: 500 });
  }
}