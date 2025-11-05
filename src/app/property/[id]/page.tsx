'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PropertyLoadingAnimation } from '@/components/ui/PropertyLoadingAnimation'
import { useNavigation } from '@/contexts/NavigationContext'

export default function PropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { goBack } = useNavigation()
  const [loading, setLoading] = useState(true)

  const propertyId = params.id

  useEffect(() => {
    const redirectToNewUrl = async () => {
      try {
        setLoading(true)

        // Fetch property to determine correct URL
        const response = await fetch(`/api/properties/${propertyId}`)

        if (!response.ok) {
          throw new Error('Property not found')
        }

        const data = await response.json()

        if (data.success && data.data) {
          const property = data.data
          // Determine type based on status: "Kiro" for rent, "Iib" for sale
          const propertyType = property.status === 'For Rent' ? 'kiro' : 'iib'
          // Redirect to new URL format
          router.replace(`/${propertyType}/${propertyId}`)
        } else {
          throw new Error('Property not found')
        }
      } catch (error) {
        console.error('Error fetching property:', error)
        // Redirect to home page if property not found
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      redirectToNewUrl()
    }
  }, [propertyId, router])


  if (loading) {
    return <PropertyLoadingAnimation propertyType="iib" />
  }

  return null
}
