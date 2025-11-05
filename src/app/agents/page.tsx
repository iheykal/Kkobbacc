'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import RedirectAnimation from '@/components/ui/RedirectAnimation'

export default function AgentsPage() {
  const router = useRouter()
  const [showAnimation, setShowAnimation] = useState(true)

  useEffect(() => {
    // Show animation for a bit, then redirect
    const timer = setTimeout(() => {
      router.push('/agent')
    }, 2500) // Show animation for 2.5 seconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <RedirectAnimation 
      isVisible={showAnimation}
      message="Redirecting to Agent Dashboard..."
      destination="Agent Dashboard"
    />
  )
}
