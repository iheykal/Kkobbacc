// Simple event system for property changes
type PropertyEventType = 'deleted' | 'updated' | 'added' | 'refresh';

type PropertyEventListener = (eventType: PropertyEventType, propertyId?: string) => void;

class PropertyEventManager {
  private listeners: PropertyEventListener[] = [];

  subscribe(listener: PropertyEventListener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(eventType: PropertyEventType, propertyId?: string) {
    console.log('📡 PropertyEventManager emitting event:', { eventType, propertyId, listenerCount: this.listeners.length });
    this.listeners.forEach((listener, index) => {
      try {
        console.log(`📡 Calling listener ${index + 1}/${this.listeners.length}`);
        listener(eventType, propertyId);
      } catch (error) {
        console.error('Error in property event listener:', error);
      }
    });
  }

  // Convenience methods
  notifyDeleted(propertyId: string) {
    console.log('🗑️ PropertyEventManager.notifyDeleted called with:', propertyId);
    this.emit('deleted', propertyId);
  }

  notifyUpdated(propertyId: string) {
    console.log('🔄 PropertyEventManager.notifyUpdated called with:', propertyId);
    this.emit('updated', propertyId);
  }

  notifyAdded(propertyId: string) {
    console.log('➕ PropertyEventManager.notifyAdded called with:', propertyId);
    this.emit('added', propertyId);
  }

  notifyRefresh() {
    console.log('🔄 PropertyEventManager.notifyRefresh called');
    this.emit('refresh');
  }
}

// Export singleton instance
export const propertyEventManager = new PropertyEventManager();

// Export types
export type { PropertyEventType, PropertyEventListener };
