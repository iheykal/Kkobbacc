// Navigation prevention utilities to prevent page refreshes

export const preventPageRefresh = () => {
  if (typeof window === 'undefined') return

  // Store original pushState and replaceState
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  // Override pushState to add our custom state
  history.pushState = function(state, title, url) {
    const newState = {
      ...state,
      preventRefresh: true,
      timestamp: Date.now()
    }
    return originalPushState.call(this, newState, title, url)
  }

  // Override replaceState to add our custom state
  history.replaceState = function(state, title, url) {
    const newState = {
      ...state,
      preventRefresh: true,
      timestamp: Date.now()
    }
    return originalReplaceState.call(this, newState, title, url)
  }

  // Handle popstate events
  const handlePopState = (event: PopStateEvent) => {
    console.log('🔙 Global PopState detected:', {
      state: event.state,
      url: window.location.href,
      pathname: window.location.pathname
    })

    // If we have preventRefresh in state, don't allow refresh
    if (event.state?.preventRefresh) {
      console.log('🚫 Preventing page refresh due to preventRefresh flag')
      
      // Restore the state to prevent refresh
      setTimeout(() => {
        history.replaceState({
          ...event.state,
          preventRefresh: true,
          timestamp: Date.now()
        }, '', window.location.href)
      }, 0)
    }
  }

  window.addEventListener('popstate', handlePopState)

  // Cleanup function
  return () => {
    window.removeEventListener('popstate', handlePopState)
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
  }
}

export const addNavigationState = (url: string) => {
  if (typeof window === 'undefined') return

  const state = {
    preventRefresh: true,
    timestamp: Date.now(),
    url: url
  }

  history.pushState(state, '', url)
  console.log('📝 Added navigation state:', state)
}

export const isBackNavigation = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  return navigationEntry?.type === 'back_forward'
}
