/**
 * Agent Slug Utilities
 * Functions to generate and resolve agent profile slugs
 * 
 * NOTE: This file is server-only and should NOT be imported in client components.
 * Use /api/agents/slug API route instead for client-side slug generation.
 */

'use server';

import User from '@/models/User';
import connectDB from '@/lib/mongodb';

/**
 * Generate a URL-friendly slug from agent name
 * Example: "Kobac Property" -> "kobac-property"
 */
export function generateSlug(name: string): string {
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
 * Example: "kobac-real-estate" -> "kobac-real-estate-2" if exists
 */
export async function getUniqueSlug(agentId: string, name: string): Promise<string> {
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
 * Resolve agent ID from slug (try slug first, then fallback to ID)
 */
export async function resolveAgentIdFromSlug(slugOrId: string): Promise<string | null> {
  await connectDB();

  // First try to find by slug
  const agentBySlug = await User.findOne({
    'profile.slug': slugOrId,
    role: { $in: ['agent', 'agency'] }
  }).select('_id').lean();

  if (agentBySlug && !Array.isArray(agentBySlug) && agentBySlug._id) {
    return agentBySlug._id.toString();
  }

  // If not found by slug, try as ObjectId (for backward compatibility)
  if (/^[0-9a-fA-F]{24}$/.test(slugOrId)) {
    const agentById = await User.findById(slugOrId).select('_id').lean();
    if (agentById && !Array.isArray(agentById) && agentById._id) {
      return agentById._id.toString();
    }
  }

  return null;
}

/**
 * Get agent slug from agent ID or name
 */
export async function getAgentSlug(agentId: string, agentName?: string): Promise<string> {
  await connectDB();

  // Try to get existing slug from user profile
  const user = await User.findById(agentId).select('profile.slug fullName firstName lastName').lean();

  if (user && !Array.isArray(user) && user.profile?.slug) {
    return user.profile.slug;
  }

  // Generate slug from name
  const userObj = user && !Array.isArray(user) ? user : null;
  const name = agentName || userObj?.fullName || `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.trim();
  if (!name) {
    return `agent-${agentId.slice(-8)}`;
  }

  // Get unique slug and save it to user profile
  const slug = await getUniqueSlug(agentId, name);

  // Save slug to user profile for future use
  try {
    await User.findByIdAndUpdate(agentId, {
      $set: { 'profile.slug': slug }
    });
  } catch (error) {
    console.error('Error saving slug:', error);
  }

  return slug;
}
