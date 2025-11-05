import { NextRequest, NextResponse } from 'next/server';
import { agentCache } from '@/lib/agentCache';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * Instant agent API - only returns cached data, no database queries
 * Now supports both slug-based and ID-based URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  try {
    const slugOrId = params.id;
    console.log('⚡ Instant agent API for slug/ID:', slugOrId);
    
    // Try to resolve agent ID from slug or ID (for cache lookup)
    let agentId: string | null = null;
    
    // First try cache with slug directly (in case it's already cached)
    const cachedBySlug = agentCache.get(slugOrId);
    if (cachedBySlug) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Instant cache hit by slug in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedBySlug,
        cached: true,
        responseTime: responseTime
      });
    }
    
    // Resolve slug to ID for cache lookup
    await connectDB();
    const agentBySlug = await User.findOne({
      'profile.slug': slugOrId,
      role: { $in: ['agent', 'agency'] }
    }).select('_id').lean();
    
    if (agentBySlug && !Array.isArray(agentBySlug) && agentBySlug._id) {
      agentId = agentBySlug._id.toString();
    } else if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
      // If not found by slug, try as ObjectId
      const agentById = await User.findById(slugOrId).select('_id').lean();
      if (agentById && !Array.isArray(agentById) && agentById._id) {
        agentId = agentById._id.toString();
      }
    }
    
    if (!agentId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agent not found',
          code: 'NO_CACHE',
          responseTime: Date.now() - startTime
        },
        { status: 404 }
      );
    }
    
    // Only check cache - no database queries
    const cachedData = agentCache.get(agentId);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      console.log(`⚡ Instant cache hit in ${responseTime}ms`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        responseTime: responseTime
      });
    }
    
    // No cache - return specific error code for frontend handling
    const responseTime = Date.now() - startTime;
    console.log(`⚡ No cache found in ${responseTime}ms`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'No cached data available',
        code: 'NO_CACHE',
        responseTime: responseTime
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error in instant agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
