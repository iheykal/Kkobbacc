'use client'

import dynamic from 'next/dynamic'
import { ComponentProps, ReactElement, ComponentType } from 'react'

// Dynamic wrapper for framer-motion to reduce initial bundle size
// This loads framer-motion only when animations are actually needed

// Note: motion itself cannot be dynamically loaded as it's not a component
// Use LazyMotionDiv, LazyMotionButton, etc. instead, or use createLazyMotionComponent

// Lazy AnimatePresence
export const LazyAnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => ({
    default: mod.AnimatePresence,
  })),
  {
    ssr: false,
  }
)

// Helper to create lazy motion components
export function createLazyMotionComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T
) {
  return dynamic(
    () =>
      import('framer-motion').then((mod) => ({
        default: (mod.motion as any)[tag],
      })),
    {
      ssr: false,
    }
  ) as ComponentType<any>
}

// Pre-created lazy motion components for common use cases
export const LazyMotionDiv = createLazyMotionComponent('div')
export const LazyMotionButton = createLazyMotionComponent('button')
export const LazyMotionInput = createLazyMotionComponent('input')
export const LazyMotionP = createLazyMotionComponent('p')
export const LazyMotionImg = createLazyMotionComponent('img')
export const LazyMotionSpan = createLazyMotionComponent('span')
export const LazyMotionSection = createLazyMotionComponent('section')
export const LazyMotionNav = createLazyMotionComponent('nav')
export const LazyMotionH1 = createLazyMotionComponent('h1')
export const LazyMotionH2 = createLazyMotionComponent('h2')
export const LazyMotionH3 = createLazyMotionComponent('h3')





