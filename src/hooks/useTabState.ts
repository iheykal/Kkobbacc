'use client'

import { useState, useEffect } from 'react'
import { useNavigation } from '@/contexts/NavigationContext'

interface TabStateOptions {
  propertyId: string
  defaultTab?: string
  tabs: string[]
}

export const useTabState = ({ propertyId, defaultTab = 'details', tabs }: TabStateOptions) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { preserveState, getPreservedState, isReturningFromBack } = useNavigation()

  useEffect(() => {
    if (isReturningFromBack) {
      // Restore tab state when returning from back navigation
      const savedState = getPreservedState(`tabs_${propertyId}`)
      if (savedState && savedState.activeTab && tabs.includes(savedState.activeTab)) {
        setActiveTab(savedState.activeTab)
      }
    }
  }, [isReturningFromBack, propertyId, tabs, getPreservedState])

  const switchTab = (tabName: string) => {
    if (!tabs.includes(tabName)) {
      console.warn(`Tab "${tabName}" is not in the available tabs: ${tabs.join(', ')}`)
      return
    }

    setActiveTab(tabName)
    
    // Save tab state
    preserveState(`tabs_${propertyId}`, {
      activeTab: tabName,
      timestamp: Date.now()
    })
  }

  const saveTabState = () => {
    preserveState(`tabs_${propertyId}`, {
      activeTab,
      timestamp: Date.now()
    })
  }

  return {
    activeTab,
    switchTab,
    saveTabState,
    isActiveTab: (tabName: string) => activeTab === tabName
  }
}
