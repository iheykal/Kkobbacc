'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

interface ScrollRestorationIndicatorProps {
  isVisible: boolean
  status: 'success' | 'error' | 'loading'
  message: string
  onClose: () => void
}

export const ScrollRestorationIndicator: React.FC<ScrollRestorationIndicatorProps> = ({
  isVisible,
  status,
  message,
  onClose
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className={`${getStatusColor()} border rounded-lg shadow-lg backdrop-blur-sm p-4 relative`}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Content */}
            <div className="flex items-start space-x-3 pr-6">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon()}
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            
            {/* Progress bar for loading state */}
            {status === 'loading' && (
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="mt-3 h-1 bg-blue-200 rounded-full overflow-hidden"
              >
                <div className="h-full bg-blue-500 rounded-full" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
