'use client'

import React from 'react'
import { useUser } from '@/contexts/UserContext'
import { BackgroundAuthLoader } from '@/components/ui/BackgroundAuthLoader'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export const ClientLayoutWrapper: React.FC<ClientLayoutWrapperProps> = ({ children }) => {
  const { isLoading } = useUser()

  return (
    <>
      {children}
      {/* <BackgroundAuthLoader isLoading={isLoading} /> */}
    </>
  )
}
