import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Calendar, AlertTriangle, CheckCircle, User, MapPin, DollarSign } from 'lucide-react'

interface PropertyExpirationModalProps {
  isOpen: boolean
  onClose: () => void
  property: {
    _id: string
    propertyId: number
    title: string
    location: string
    district: string
    listingType: string
    expiresAt: string
    createdAt: string
    agentName: string
    price: number
    beds?: number
    baths?: number
    sqft?: number
    status?: string
  } | null
}

export default function PropertyExpirationModal({ isOpen, onClose, property }: PropertyExpirationModalProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!property) return null

  const getCountdownTime = () => {
    const expirationDate = new Date(property.expiresAt)
    const now = currentTime
    const diff = expirationDate.getTime() - now.getTime()

    if (diff <= 0) {
      return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { expired: false, days, hours, minutes, seconds }
  }

  const getStatusColor = () => {
    const countdown = getCountdownTime()
    
    if (countdown.expired) return 'text-red-600 bg-red-100'
    if (countdown.days <= 1) return 'text-red-500 bg-red-50'
    if (countdown.days <= 3) return 'text-orange-600 bg-orange-100'
    if (countdown.days <= 7) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusIcon = () => {
    const countdown = getCountdownTime()
    
    if (countdown.expired) return <AlertTriangle className="w-5 h-5 text-red-600" />
    if (countdown.days <= 3) return <AlertTriangle className="w-5 h-5 text-orange-600" />
    return <CheckCircle className="w-5 h-5 text-green-600" />
  }

  const formatCountdown = () => {
    const countdown = getCountdownTime()
    
    if (countdown.expired) {
      return 'Expired'
    }

    const parts = []
    if (countdown.days > 0) parts.push(`${countdown.days}d`)
    if (countdown.hours > 0) parts.push(`${countdown.hours}h`)
    if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`)
    if (countdown.seconds > 0) parts.push(`${countdown.seconds}s`)

    return parts.length > 0 ? parts.join(' ') : 'Expiring now'
  }

  const getExpirationRule = () => {
    return property.listingType === 'rent' ? '30 days' : '90 days'
  }

  const getDaysSinceCreated = () => {
    const created = new Date(property.createdAt)
    const now = currentTime
    const diff = now.getTime() - created.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Property Expiration Details</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Property Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Property Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Title:</span>
                    <p className="font-medium">{property.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Property ID:</span>
                    <p className="font-medium">{property.propertyId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <p className="font-medium">{property.location}, {property.district}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium capitalize">{property.listingType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <p className="font-medium text-green-600 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {property.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Agent:</span>
                    <p className="font-medium flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {property.agentName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expiration Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  {getStatusIcon()}
                  Expiration Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <div className={`mt-1 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
                      {formatCountdown()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Expiration Date:</span>
                    <p className="font-medium flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(property.expiresAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Countdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Live Countdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getCountdownTime().days}</div>
                    <div className="text-sm text-gray-600">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getCountdownTime().hours}</div>
                    <div className="text-sm text-gray-600">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getCountdownTime().minutes}</div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getCountdownTime().seconds}</div>
                    <div className="text-sm text-gray-600">Seconds</div>
                  </div>
                </div>
              </div>

              {/* Timeline Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Timeline Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(property.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days since created:</span>
                    <span className="font-medium">{getDaysSinceCreated()} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiration rule:</span>
                    <span className="font-medium">{getExpirationRule()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last updated:</span>
                    <span className="font-medium">{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
