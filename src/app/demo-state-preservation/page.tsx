'use client'


export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation } from '@/contexts/NavigationContext'
import { useViewCounter } from '@/hooks/useViewCounter'
import { useTabState } from '@/hooks/useTabState'
import { StateRestoredIndicator } from '@/components/ui/StateRestoredIndicator'
import { ArrowLeft, Heart, Eye, Save } from 'lucide-react'

export default function DemoStatePreservationPage() {
  const router = useRouter()
  const { goBack, showStateRestored } = useNavigation()
  const { viewCount, isReturningFromBack } = useViewCounter({ 
    propertyId: 'demo-property-123' 
  })
  const { activeTab, switchTab, isActiveTab } = useTabState({
    propertyId: 'demo-property-123',
    defaultTab: 'details',
    tabs: ['details', 'location', 'gallery', 'amenities']
  })
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBack = () => {
    goBack()
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* State Restoration Indicator */}
      <StateRestoredIndicator show={showStateRestored} />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Properties</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">State Preservation Demo</h1>
                <p className="text-sm text-gray-500">Demonstrating back navigation without refresh</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleFavorite}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'text-red-600 bg-red-50 border border-red-200' 
                    : 'text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Property Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-3xl font-bold mb-2">Luxury Villa Demo</h2>
              <p className="text-xl">$750,000</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Property Features</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🛏</span>
                    <span>4 Bedrooms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🛁</span>
                    <span>3 Bathrooms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">📏</span>
                    <span>2,800 sq ft</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🚗</span>
                    <span>2 Car Garage</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4">State Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Tab:</span>
                    <span className="font-medium text-blue-600">{activeTab}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scroll Position:</span>
                    <span className="font-medium text-blue-600">{Math.round(scrollPosition)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Favorite Status:</span>
                    <span className={`font-medium ${isFavorite ? 'text-red-600' : 'text-gray-600'}`}>
                      {isFavorite ? 'Saved' : 'Not Saved'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>View Count:</span>
                    <span className="font-medium text-blue-600">{viewCount}</span>
                  </div>
                  {isReturningFromBack && (
                    <div className="flex justify-between">
                      <span>Navigation:</span>
                      <span className="font-medium text-green-600">From Back Button</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab System */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['details', 'location', 'gallery', 'amenities'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    isActiveTab(tab)
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'details' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                <p className="text-gray-600 mb-4">
                  This stunning modern villa offers breathtaking views, spacious living areas, and premium finishes throughout. 
                  Located in a prestigious neighborhood, it features an open floor plan perfect for entertaining.
                </p>
                <p className="text-gray-600">
                  The property features hardwood floors throughout, stainless steel appliances, granite countertops, 
                  and a master suite with a walk-in closet and luxurious bathroom.
                </p>
              </div>
            )}
            
            {activeTab === 'location' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Location Information</h3>
                <p className="text-gray-600 mb-4">
                  Located in the prestigious Hillside neighborhood, this property is just minutes from downtown, 
                  with easy access to shopping, dining, and excellent schools.
                </p>
                <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Interactive Map Would Appear Here</span>
                </div>
              </div>
            )}
            
            {activeTab === 'gallery' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Photo Gallery</h3>
                <p className="text-gray-600 mb-4">
                  View our extensive collection of photos showcasing this beautiful property from every angle.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-gray-200 h-24 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">Photo {i}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'amenities' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Interior Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Hardwood Floors</li>
                      <li>• Stainless Steel Appliances</li>
                      <li>• Granite Countertops</li>
                      <li>• Walk-in Closets</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Exterior Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Professional Landscaping</li>
                      <li>• Patio Area</li>
                      <li>• Water Feature</li>
                      <li>• Two-Car Garage</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Test State Preservation</h3>
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start space-x-3">
              <Eye className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">1. Scroll down and switch between tabs</p>
                <p className="text-sm text-blue-700">Notice the scroll position and active tab are tracked</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Heart className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">2. Click the "Save" button to mark as favorite</p>
                <p className="text-sm text-blue-700">The favorite state will be preserved</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Save className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">3. Click "Back to Properties" and then return</p>
                <p className="text-sm text-blue-700">All state (scroll, tabs, favorites, view count) will be restored</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Counter */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-600">
            This demo page has been viewed <span className="font-semibold text-blue-600">{viewCount}</span> times
            {isReturningFromBack && (
              <span className="ml-2 text-green-600 text-xs">(State preserved from back navigation)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
