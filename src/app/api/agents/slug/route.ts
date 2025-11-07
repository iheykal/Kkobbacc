import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * Generate a URL-friendly slug from agent name
 */
function generateSlug(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get unique slug for an agent - if slug exists, add number suffix
 */
async function getUniqueSlug(agentId: string, name: string): Promise<string> {
  await connectDB();
  
  const baseSlug = generateSlug(name);
  if (!baseSlug) {
    // Fallback to ID-based slug if name is empty
    return `agent-${agentId.slice(-8)}`;
  }
  
  // Check if base slug exists for another agent
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existingAgent = await User.findOne({
      'profile.slug': slug,
      _id: { $ne: agentId }
    }).select('_id').lean();
    
    if (!existingAgent) {
      // Slug is available
      break;
    }
    
    // Slug exists, try with number suffix
    counter++;
    slug = `${baseSlug}-${counter}`;
    
    // Prevent infinite loop (max 100 attempts)
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

/**
 * GET /api/agents/slug - Get agent slug from agent ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const agentName = searchParams.get('agentName') || '';
    
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'agentId is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Try to get existing slug from user profile
    const user = await User.findById(agentId).select('profile.slug fullName firstName lastName').lean();
    
    if (user && !Array.isArray(user) && user.profile?.slug) {
      return NextResponse.json({
        success: true,
        slug: user.profile.slug
      });
    }
    
    // Generate slug from name
    const name = agentName || (user && !Array.isArray(user) ? user.fullName : null) || `${(user && !Array.isArray(user) ? user.firstName : null) || ''} ${(user && !Array.isArray(user) ? user.lastName : null) || ''}`.trim();
    if (!name) {
      return NextResponse.json({
        success: true,
        slug: `agent-${agentId.slice(-8)}`
      });
    }
    
    // Get unique slug and save it to user profile
    const slug = await getUniqueSlug(agentId, name);
    
    // Save slug to user profile for future use
    try {
      await User.findByIdAndUpdate(agentId, {
        $set: { 'profile.slug': slug }
      });
    } catch (error) {
      console.warn('⚠️ Could not save slug to user profile:', error);
    }
    
    return NextResponse.json({
      success: true,
      slug: slug
    });
    
  } catch (error) {
    console.error('Error getting agent slug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent slug', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}





