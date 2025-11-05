'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'luxury' | 'gold'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = 'md',
      children,
      disabled,
      type: nativeType = 'submit',
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center font-medium transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'transform hover:scale-105 active:scale-95',
      fullWidth && 'w-full',
      rounded === 'sm' && 'rounded-sm',
      rounded === 'md' && 'rounded-md',
      rounded === 'lg' && 'rounded-lg',
      rounded === 'full' && 'rounded-full'
    )

    const variantClasses = {
      primary: cn(
        'bg-primary-900 text-white hover:bg-primary-800',
        'focus:ring-primary-500 shadow-luxury'
      ),
      secondary: cn(
        'bg-primary-100 text-primary-900 hover:bg-primary-200',
        'focus:ring-primary-500'
      ),
      outline: cn(
        'border-2 border-primary-300 text-primary-700 hover:bg-primary-50',
        'focus:ring-primary-500 hover:border-primary-400'
      ),
      ghost: cn(
        'text-primary-700 hover:bg-primary-100 focus:ring-primary-500'
      ),
      luxury: cn(
        'bg-gradient-to-r from-primary-900 to-primary-800 text-white',
        'hover:from-primary-800 hover:to-primary-700',
        'focus:ring-primary-500 shadow-luxury'
      ),
      gold: cn(
        'bg-gradient-to-r from-luxury-gold to-accent-500 text-white',
        'hover:from-accent-500 hover:to-luxury-gold',
        'focus:ring-accent-500 shadow-glow'
      )
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl'
    }

    const iconClasses = cn(
      size === 'sm' && 'w-4 h-4',
      size === 'md' && 'w-5 h-5',
      size === 'lg' && 'w-6 h-6',
      size === 'xl' && 'w-7 h-7'
    )

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        type={nativeType}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading ? (
          <motion.div
            className={cn('mr-2', iconClasses)}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>
        ) : (
          icon && iconPosition === 'left' && (
            <span className={cn('mr-2', iconClasses)}>{icon}</span>
          )
        )}
        
        {children}
        
        {icon && iconPosition === 'right' && !loading && (
          <span className={cn('ml-2', iconClasses)}>{icon}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
