/**
 * Agent Navigation Utilities
 * Helper functions for navigating to agent profile pages
 * Now uses slug-based URLs (e.g., /agent/kobac-real-estate) instead of IDs
 */

/**
 * Safely extract agent ID as a string from any value
 */
export function extractAgentIdAsString(value: any): string | undefined {
  if (!value) return undefined;
  
  // If it's already a string, validate it's not [object Object]
  if (typeof value === 'string') {
    if (value === '[object Object]' || value.includes('object Object')) {
      return undefined;
    }
    return value;
  }
  
  // If it's a number, convert to string
  if (typeof value === 'number') {
    return String(value);
  }
  
  // If it's an object, extract the ID
  if (typeof value === 'object' && value !== null) {
    const id = (value as any)?._id || (value as any)?.id || (value as any)?.toString?.();
    if (id && (typeof id === 'string' || typeof id === 'number')) {
      const stringId = String(id);
      if (stringId !== '[object Object]' && !stringId.includes('object Object')) {
        return stringId;
      }
    }
  }
  
  return undefined;
}

/**
 * Resolve agent ID from a property object
 */
export function resolveAgentId(property: any): string | number | undefined {
  console.log('🔍 Resolving agent ID from property:', {
    propertyId: property.propertyId || property._id,
    agentId: property.agentId,
    agent: property.agent,
    agentKeys: property.agent ? Object.keys(property.agent) : 'no agent object'
  });
  
  // Try all possible ID fields in order of preference
  const possibleIds = [
    property.agentId, // Top-level agentId
    property.agent?.id, // agent.id
    (property.agent as any)?._id, // agent._id
    property.agent?.agentId, // agent.agentId
    property.agent?.userId, // agent.userId
    (property.agent as any)?.['user_id'], // agent.user_id
    (property.agent as any)?.['agent_id'] // agent.agent_id
  ];
  
  // Find the first valid ID using the safe extraction function
  for (const id of possibleIds) {
    const extractedId = extractAgentIdAsString(id);
    if (extractedId) {
      console.log('✅ Found valid agent ID:', extractedId);
      return extractedId;
    }
  }
  
  console.warn('❌ No agent ID found in property');
  return undefined;
}

/**
 * Navigate to agent profile page
 */
export async function navigateToAgentProfile(
  property: any,
  router: any,
  onClose?: () => void
): Promise<void> {
  console.log('🚀 navigateToAgentProfile called with:', {
    property: property,
    hasRouter: !!router,
    routerType: typeof router,
    routerMethods: router ? Object.keys(router) : 'no router'
  });
  
  const agentId = resolveAgentId(property);
  console.log('📋 Resolved agent ID:', agentId);
  
  if (!agentId) {
    console.warn('❌ No agent ID found for property:', property);
    
    // Try to find agent by name as fallback
    if (property.agent?.name) {
      try {
        console.log('🔍 Trying to find agent by name:', property.agent.name);
        const response = await fetch(`/api/agents/by-name?name=${encodeURIComponent(property.agent.name)}`);
        if (response.ok) {
          const result = await response.json();
          console.log('📋 Agent by name result:', result);
          if (result.success && result.data?.id) {
            const foundAgentId = result.data.id;
            // Use the safe extraction function
            const finalFoundAgentId = extractAgentIdAsString(foundAgentId);
            
            if (!finalFoundAgentId) {
              console.error('❌ Invalid foundAgentId after extraction:', foundAgentId);
              alert('Invalid agent information. Please try again.');
              return;
            }
            
            console.log('✅ Found agent by name, navigating to:', finalFoundAgentId);
            const agentUrl = `/agent/${encodeURIComponent(finalFoundAgentId)}`;
            console.log('🔗 Navigating to:', agentUrl);
            
            // Navigate to agent profile using window.location.href for reliability
            if (typeof window !== 'undefined') {
              console.log('🌐 Navigating to agent by name using window.location.href:', agentUrl);
              window.location.href = agentUrl;
            } else {
              // Fallback to router.push if window is not available (SSR)
              try {
                if (router && typeof router.push === 'function') {
                  console.log('✅ Calling router.push for agent by name (SSR):', agentUrl);
                  router.push(agentUrl);
                } else {
                  throw new Error('Router.push is not a function');
                }
              } catch (routerError) {
                console.error('❌ Router.push failed:', routerError);
              }
            }
            return;
          }
        }
      } catch (error) {
        console.error('❌ Error finding agent by name:', error);
      }
    }
    
    alert("Agent information is not available for this property.");
    return;
  }
  
  // Use the safe extraction function to ensure agentId is a valid string
  const finalAgentId = agentId ? extractAgentIdAsString(agentId) : undefined;
  
  if (!finalAgentId) {
    console.error('❌ Invalid agentId after extraction:', agentId);
    alert('Invalid agent information. Please try again.');
    return;
  }
  
  // Get agent slug for URL-friendly navigation via API
  let agentSlug: string = finalAgentId; // Default to ID
  try {
    // Get agent name from property if available
    const agentName = property.agent?.name || '';
    const response = await fetch(`/api/agents/slug?agentId=${encodeURIComponent(finalAgentId)}&agentName=${encodeURIComponent(agentName)}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.slug) {
        agentSlug = result.slug;
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not get agent slug, using ID as fallback:', error);
  }
  
  const agentUrl = `/agent/${encodeURIComponent(agentSlug)}`;
  console.log('🔍 Navigating to agent profile page:', {
    originalAgentId: agentId,
    finalAgentId: finalAgentId,
    agentSlug: agentSlug,
    agentUrl: agentUrl,
    hasRouter: !!router,
    hasOnClose: !!onClose
  });

  // Navigate to agent profile
  // Use window.location.href for more reliable navigation
  // Note: We don't call onClose() here because navigation will replace the current page
  if (typeof window !== 'undefined') {
    console.log('🌐 Navigating using window.location.href:', agentUrl);
    window.location.href = agentUrl;
  } else {
    // Fallback to router.push if window is not available (SSR)
    try {
      if (router && typeof router.push === 'function') {
        console.log('✅ Calling router.push (SSR fallback):', agentUrl);
        router.push(agentUrl);
        console.log('✅ Router.push called successfully');
      } else {
        throw new Error('Router.push is not available');
      }
    } catch (error) {
      console.error('❌ Router.push failed:', error);
      alert('Unable to navigate to agent profile. Please try again.');
    }
  }
}

/**
 * Get click handler for agent profile picture
 */
export function getAgentProfileClickHandler(
  property: any,
  router: any,
  onClose?: () => void
) {
  return async (e?: React.MouseEvent) => {
    console.log('🖱️ Agent profile clicked:', {
      property: property,
      agentId: property.agentId,
      agent: property.agent
    });
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      await navigateToAgentProfile(property, router, onClose);
    } catch (error) {
      console.error('❌ Error navigating to agent profile:', error);
    }
  };
}

