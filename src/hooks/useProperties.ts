import { useState, useEffect, useCallback } from 'react';
import { propertyEventManager, PropertyEventType } from '@/lib/propertyEvents';

export interface Property {
  _id: string;
  propertyId?: number;
  title: string;
  location: string;
  district: string; // Add district field
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  status: string;
  listingType?: string;
  documentType?: string;
  measurement?: string;
  description: string;
  features: string[];
  amenities: string[];
  images: string[];
  agentId?: string; // Add agentId field
  agent: {
    name: string;
    phone: string;
    image: string;
    rating: number;
  };
  featured: boolean;
  viewCount?: number;
  uniqueViewCount?: number;
  deletionStatus?: 'active' | 'pending_deletion' | 'deleted'; // Add deletionStatus field
  // Property expiration fields
  expiresAt?: string; // ISO date string
  isExpired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  listingType: 'all' | 'sale' | 'rent'
  district: string
}

export const useProperties = (featured?: boolean, filters?: FilterOptions) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache key for this specific query
  const cacheKey = `properties_${featured ? 'featured' : 'all'}_${JSON.stringify(filters || {})}`;

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Detect mobile device
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // For mobile, use shorter cache time or skip cache to ensure fresh data
      const cacheValidTime = isMobile ? 60000 : 300000; // 1 minute for mobile, 5 minutes for desktop
      
      // Check cache first (but skip on mobile for first load to ensure fresh data)
      const cachedData = sessionStorage.getItem(`cache_${cacheKey}`);
      const cacheTimestamp = sessionStorage.getItem(`cache_timestamp_${cacheKey}`);
      const now = Date.now();
      const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
      const cacheValid = cacheAge < cacheValidTime;
      
      // Only use cache if valid and not on mobile (or if mobile cache is fresh)
      if (cachedData && cacheValid && (!isMobile || cacheAge < 60000)) {
        try {
          const parsed = JSON.parse(cachedData);
          setProperties(parsed);
          setLoading(false);
          // Still fetch fresh data in background for mobile
          if (isMobile) {
            // Continue to fetch fresh data below
          } else {
            return;
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse cached data, fetching fresh:', parseError);
          // Continue to fetch fresh data
        }
      }
      
      const params = new URLSearchParams();
      if (featured) {
        params.append('featured', 'true');
      }
      
      // Add filter parameters
      if (filters) {
        if (filters.listingType && filters.listingType !== 'all') {
          params.append('listingType', filters.listingType);
        }
        if (filters.district) {
          params.append('district', filters.district);
        }
      }
      
      // Always ask for latest first so new uploads surface immediately
      params.append('sort', 'latest');
      
      // Optimized limit for better performance - reduced from 100 to 20 for faster initial load
      params.append('limit', '20'); // Reduced limit for faster initial load and smaller payload
      
      // Build headers for mobile detection
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add mobile optimization header
      if (isMobile) {
        headers['x-mobile-optimized'] = 'true';
      }
      
      console.log('📱 Fetching properties:', { isMobile, cacheKey, cacheValid, hasCache: !!cachedData });
      
      const response = await fetch(`/api/properties?${params.toString()}`, {
        credentials: 'include',
        headers: headers,
        // For mobile, use no-cache or reload to ensure fresh data
        cache: isMobile ? 'no-cache' : 'force-cache',
        // Add cache-busting for mobile
        ...(isMobile ? { next: { revalidate: 0 } } : { next: { revalidate: 30 } })
      });
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || JSON.stringify(errorData);
        } catch {
          errorText = response.statusText || 'Unknown error';
        }
        console.error('❌ API Error:', { status: response.status, statusText: response.statusText, error: errorText });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('✅ Properties fetched:', { 
        success: data.success, 
        count: data.data?.length || 0,
        hasMeta: !!data.meta 
      });
      
      if (data.success && Array.isArray(data.data)) {
        setProperties(data.data);
        // Cache the data (always update cache with fresh data)
        try {
          sessionStorage.setItem(`cache_${cacheKey}`, JSON.stringify(data.data));
          sessionStorage.setItem(`cache_timestamp_${cacheKey}`, now.toString());
        } catch (storageError) {
          console.warn('⚠️ Failed to cache data (storage may be full):', storageError);
        }
      } else {
        const errorMsg = data.error || 'Invalid response format';
        console.error('❌ Invalid response:', { data, errorMsg });
        setError(errorMsg);
        // If we have cached data, use it as fallback
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setProperties(parsed);
            console.log('📦 Using cached data as fallback');
          } catch (parseError) {
            console.error('❌ Failed to parse cached fallback:', parseError);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch properties';
      console.error('❌ Fetch error:', err);
      setError(errorMsg);
      
      // Try to use cached data as fallback
      try {
        const cachedData = sessionStorage.getItem(`cache_${cacheKey}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setProperties(parsed);
          console.log('📦 Using cached data due to fetch error');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse cached fallback:', parseError);
      }
    } finally {
      setLoading(false);
    }
  }, [featured, filters, cacheKey]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Listen for property events
  useEffect(() => {
    const unsubscribe = propertyEventManager.subscribe((eventType, propertyId) => {
      console.log('🔔 useProperties received event:', { eventType, propertyId });
      switch (eventType) {
        case 'deleted':
          if (propertyId) {
            console.log('🗑️ Removing property from list:', propertyId);
            setProperties(prev => prev.filter(prop => prop._id !== propertyId));
          }
          break;
        case 'updated':
          console.log('🔄 Refreshing properties due to update event');
          // Refresh properties to get updated data
          fetchProperties();
          break;
        case 'added':
          console.log('➕ Refreshing properties due to add event');
          // Refresh properties to get new data
          fetchProperties();
          break;
        case 'refresh':
          console.log('🔄 Force refreshing properties');
          // Force refresh
          fetchProperties();
          break;
      }
    });

    return unsubscribe;
  }, [fetchProperties]);

  const clearCache = () => {
    // Clear all property caches
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('cache_properties_') || key.startsWith('cache_timestamp_properties_')) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared properties cache');
  };

  const addProperty = async (propertyData: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => [data.data, ...prev]);
        // Clear cache since we have new data
        clearCache();
        // Notify other components about the addition
        propertyEventManager.notifyAdded(data.data._id);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to add property' };
    }
  };

  const updateProperty = async (id: string, updates: Partial<Property>) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => 
          prev.map(prop => 
            prop._id === id ? { ...prop, ...data.data } : prop
          )
        );
        // Clear cache since we have updated data
        clearCache();
        // Notify other components about the update
        propertyEventManager.notifyUpdated(id);
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update property' };
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        setProperties(prev => prev.filter(prop => prop._id !== id));
        // Clear cache since we have deleted data
        clearCache();
        // Notify other components about the deletion
        propertyEventManager.notifyDeleted(id);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete property' };
    }
  };

  return {
    properties,
    loading,
    error,
    addProperty,
    updateProperty,
    deleteProperty,
    clearCache,
  };
};
