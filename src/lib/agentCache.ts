/**
 * Simple in-memory cache for agent data to improve performance
 */

interface CachedAgentData {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class AgentCache {
  private cache = new Map<string, CachedAgentData>();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
  private preloadQueue = new Set<string>();

  set(agentId: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(agentId, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Preload agent data for faster access
  async preload(agentId: string): Promise<void> {
    if (this.cache.has(agentId) || this.preloadQueue.has(agentId)) {
      return; // Already cached or being preloaded
    }
    
    this.preloadQueue.add(agentId);
    
    try {
      // Trigger background fetch to warm the cache
      console.log('🚀 Preloading agent data for:', agentId);
      
      // Use fetch to trigger the minimal API in background
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
          // Cache the preloaded data
          this.set(agentId, result.data, 15 * 60 * 1000); // 15 minutes
          console.log('✅ Agent data preloaded successfully:', agentId);
        }
      }
    } catch (error) {
      console.error('Preload error:', error);
    } finally {
      this.preloadQueue.delete(agentId);
    }
  }

  get(agentId: string): any | null {
    const cached = this.cache.get(agentId);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(agentId);
      return null;
    }

    return cached.data;
  }

  clear(agentId?: string): void {
    if (agentId) {
      this.cache.delete(agentId);
    } else {
      this.cache.clear();
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const agentCache = new AgentCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  agentCache.cleanup();
}, 10 * 60 * 1000);
