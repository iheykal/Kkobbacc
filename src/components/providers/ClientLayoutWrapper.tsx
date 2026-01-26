'use client'

import React from 'react'
import { useUser } from '@/contexts/UserContext'
import { NavigationProgressBar } from '@/components/ui/NavigationProgressBar'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export const ClientLayoutWrapper: React.FC<ClientLayoutWrapperProps> = ({ children }) => {
  const { isLoading } = useUser()

  return (
    <>
      <NavigationProgressBar />
      {children}
      {/* <BackgroundAuthLoader isLoading={isLoading} /> */}
    </>
  )
}
