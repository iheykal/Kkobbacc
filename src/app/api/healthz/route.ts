import { NextResponse } from 'next/server';

/**
 * Health check endpoint that never touches the database
 * Used by Render for health checks to ensure the app is running
 */
export async function GET() {
  return new Response('ok', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
