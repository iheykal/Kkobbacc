import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'default' | 'elevated' | 'glass' | 'premium' | 'featured'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  interactive?: boolean
  children: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = true,
      interactive = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'relative overflow-hidden transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      interactive && 'cursor-pointer'
    )

    const variantClasses = {
      default: cn(
        'bg-white border border-primary-200',
        'hover:border-primary-300 hover:shadow-md'
      ),
      elevated: cn(
        'bg-white shadow-md border border-primary-100',
        'hover:shadow-lg hover:border-primary-200'
      ),
      glass: cn(
        'bg-white/80 backdrop-blur-sm border border-white/20',
        'hover:bg-white/90 hover:shadow-lg'
      ),
      premium: cn(
        'bg-gradient-to-br from-white to-primary-50',
        'border border-primary-200 shadow-premium',
        'hover:shadow-luxury hover:border-primary-300'
      ),
      featured: cn(
        'bg-gradient-to-br from-luxury-gold/10 to-accent-100/20',
        'border-2 border-luxury-gold/30 shadow-glow',
        'hover:border-luxury-gold/50 hover:shadow-glow/50'
      )
    }

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    }

    const hoverEffect = hover ? {
      whileHover: { y: -4, scale: 1.02 },
      whileTap: { scale: 0.98 }
    } : {}

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          className
        )}
        {...hoverEffect}
        {...props}
      >
        {variant === 'featured' && (
          <div className="absolute top-0 right-0 bg-gradient-to-l from-luxury-gold to-accent-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
            Featured
          </div>
        )}
        
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-6 pt-4 border-t border-primary-100', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
)

CardTitle.displayName = 'CardTitle'

export { Card }
