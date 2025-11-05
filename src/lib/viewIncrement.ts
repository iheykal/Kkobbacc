/**
 * View increment utility with debouncing to prevent multiple calls
 */

interface ViewIncrementCache {
  [propertyId: string]: {
    timestamp: number;
    promise: Promise<any>;
  };
}

const viewIncrementCache: ViewIncrementCache = {};
const DEBOUNCE_TIME = 5000; // 5 seconds debounce

/**
 * Increment view count for a property with debouncing
 * @param propertyId - The property ID to increment views for
 * @returns Promise that resolves when view is incremented
 */
export async function incrementPropertyView(propertyId: string | number): Promise<any> {
  const id = String(propertyId);
  const now = Date.now();
  
  // Check if we have a recent call for this property
  if (viewIncrementCache[id]) {
    const { timestamp, promise } = viewIncrementCache[id];
    
    // If the call was made within the debounce time, return the existing promise
    if (now - timestamp < DEBOUNCE_TIME) {
      console.log(`🔄 View increment debounced for property ${id}`);
      return promise;
    }
  }
  
  // Create new promise for view increment
  const promise = fetch(`/api/properties/${id}/increment-view`, {
    method: 'POST',
    credentials: 'include'
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  }).catch((error) => {
    // Log error but don't throw to prevent breaking the UI
    console.warn(`⚠️ View increment failed for property ${id}:`, error.message);
    return { success: false, error: error.message };
  });
  
  // Cache the promise and timestamp
  viewIncrementCache[id] = {
    timestamp: now,
    promise
  };
  
  // Clean up cache after debounce time
  setTimeout(() => {
    delete viewIncrementCache[id];
  }, DEBOUNCE_TIME);
  
  console.log(`👁️ View increment initiated for property ${id}`);
  return promise;
}

/**
 * Clear the view increment cache (useful for testing)
 */
export function clearViewIncrementCache(): void {
  Object.keys(viewIncrementCache).forEach(key => {
    delete viewIncrementCache[key];
  });
}
