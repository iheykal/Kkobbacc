import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'default' | 'luxury' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  error?: string
  success?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      label,
      error,
      success,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      rounded = 'md',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseClasses = cn(
      'transition-all duration-300 focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-primary-400',
      fullWidth && 'w-full',
      rounded === 'sm' && 'rounded-sm',
      rounded === 'md' && 'rounded-md',
      rounded === 'lg' && 'rounded-lg',
      rounded === 'full' && 'rounded-full'
    )

    const variantClasses = {
      default: cn(
        'bg-white border border-primary-300 text-primary-900',
        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        'hover:border-primary-400'
      ),
      luxury: cn(
        'bg-gradient-to-r from-white to-primary-50 border-2 border-primary-200',
        'focus:border-luxury-gold focus:ring-2 focus:ring-luxury-gold/20',
        'hover:border-primary-300'
      ),
      outline: cn(
        'bg-transparent border-2 border-primary-200 text-primary-900',
        'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        'hover:border-primary-300'
      ),
      glass: cn(
        'bg-white/80 backdrop-blur-sm border border-white/30 text-primary-900',
        'focus:border-white/50 focus:ring-2 focus:ring-white/20',
        'hover:bg-white/90'
      )
    }

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
      xl: 'px-6 py-5 text-xl'
    }

    const iconClasses = cn(
      size === 'sm' && 'w-4 h-4',
      size === 'md' && 'w-5 h-5',
      size === 'lg' && 'w-6 h-6',
      size === 'xl' && 'w-7 h-7'
    )

    const stateClasses = error
      ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
      : success
      ? 'border-success-500 focus:border-success-500 focus:ring-success-500/20'
      : ''

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-primary-700',
              error && 'text-error-600',
              success && 'text-success-600'
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400',
              iconClasses
            )}>
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              sizeClasses[size],
              stateClasses,
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className={cn(
              'absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400',
              iconClasses
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-error-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
        
        {success && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-success-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
