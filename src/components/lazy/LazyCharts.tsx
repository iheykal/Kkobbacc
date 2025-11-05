'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Lazy load chart components to reduce initial bundle size
export const LazyDistrictPieChart = dynamic(
  () => import('@/components/charts/DistrictPieChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyListingTypePieChart = dynamic(
  () => import('@/components/charts/ListingTypePieChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyPropertyTypePieChart = dynamic(
  () => import('@/components/charts/PropertyTypePieChart'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>

export const LazyPropertyViewStats = dynamic(
  () => import('@/components/charts/PropertyViewStats'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg" />
  }
) as ComponentType<any>
