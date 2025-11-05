/**
 * Cache warming utility to pre-populate agent cache for better performance
 */

import { agentCache } from './agentCache';

class CacheWarmer {
  private warmingQueue = new Set<string>();
  private isWarming = false;

  /**
   * Warm cache for a specific agent
   */
  async warmAgentCache(agentId: string): Promise<void> {
    if (this.warmingQueue.has(agentId) || agentCache.get(agentId)) {
      return; // Already warming or cached
    }

    this.warmingQueue.add(agentId);

    try {
      console.log('🔥 Warming cache for agent:', agentId);
      
      // Use minimal API to warm cache
      const response = await fetch(`/api/agents/${agentId}/minimal`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Cache the data
          agentCache.set(agentId, result.data, 15 * 60 * 1000); // 15 minutes
          console.log('✅ Cache warmed successfully for agent:', agentId);
        }
      }
    } catch (error) {
      console.error('Cache warming failed for agent:', agentId, error);
    } finally {
      this.warmingQueue.delete(agentId);
    }
  }

  /**
   * Warm cache for multiple agents
   */
  async warmMultipleAgents(agentIds: string[]): Promise<void> {
    if (this.isWarming) {
      return; // Already warming
    }

    this.isWarming = true;
    console.log('🔥 Starting batch cache warming for', agentIds.length, 'agents');

    try {
      // Warm cache for all agents in parallel (but limit concurrency)
      const batchSize = 3;
      for (let i = 0; i < agentIds.length; i += batchSize) {
        const batch = agentIds.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(agentId => this.warmAgentCache(agentId))
        );
        
        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < agentIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } finally {
      this.isWarming = false;
      console.log('✅ Batch cache warming completed');
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      warmingQueue: this.warmingQueue.size,
      isWarming: this.isWarming,
      cacheStats: agentCache.getStats()
    };
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

// Auto-warm cache for popular agents on app start (if in browser)
if (typeof window !== 'undefined') {
  // Warm cache for common agents after a short delay
  setTimeout(() => {
    // You can add popular agent IDs here
    const popularAgents: string[] = [
      // Add popular agent IDs here
    ];
    
    if (popularAgents.length > 0) {
      cacheWarmer.warmMultipleAgents(popularAgents);
    }
  }, 2000); // 2 second delay
}
