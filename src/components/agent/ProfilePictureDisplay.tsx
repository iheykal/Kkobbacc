'use client'

import { User } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

interface ProfilePictureDisplayProps {
  className?: string
}

export default function ProfilePictureDisplay({ className = '' }: ProfilePictureDisplayProps) {
  const { user } = useUser()

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 p-[3px] shadow-lg">
            <div className="w-full h-full rounded-full bg-gray-50 overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName || 'Profile'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Silent error handling
                  }}
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="text-sm text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
          <p className="text-xs text-gray-500 mt-1">
            Profile managed by superadmin
          </p>
        </div>
      </div>

      {/* Information Card */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Profile Picture Management
            </h4>
            <p className="text-blue-700 text-xs leading-relaxed">
              Your profile picture is managed by the superadmin. Contact the admin to request changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
