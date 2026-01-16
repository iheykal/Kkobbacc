'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyDetail } from '@/components/sections/PropertyDetail';
import { StateRestoredIndicator } from '@/components/ui/StateRestoredIndicator';
import { useNavigation } from '@/contexts/NavigationContext';
import { useViewCounter } from '@/hooks/useViewCounter';
import { incrementPropertyView } from '@/lib/viewIncrement';
import { ArrowLeft, Heart } from 'lucide-react';
import { getPropertyUrl } from '@/lib/utils';
import { IProperty } from '@/models/Property';

// Interface matching the one used in the page (can be imported if centralized)
interface Property {
    _id: string;
    propertyId: number;
    title: string;
    location: string;
    district: string;
    price: number;
    beds: number;
    baths: number;
    sqft?: number;
    yearBuilt: number;
    lotSize: number;
    propertyType: string;
    status: string;
    listingType: string;
    documentType?: string;
    measurement?: string;
    description: string;
    features: string[];
    amenities: string[];
    thumbnailImage?: string;
    images: string[];
    agentId: string;
    agent: {
        name: string;
        phone: string;
        email: string;
        image: string;
        rating: number;
    };
    featured: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

interface SinglePropertyClientProps {
    initialProperty: Property; // Data passed from server
}

export default function SinglePropertyClient({ initialProperty }: SinglePropertyClientProps) {
    const router = useRouter();
    const { goBack, preserveState, getPreservedState, isReturningFromBack, showStateRestored } = useNavigation();
    const [property] = useState<Property>(initialProperty);
    const [isFavorite, setIsFavorite] = useState(false);
    const scrollPositionRef = useRef(0);
    const hasRestoredState = useRef(false);

    // Initialize view counter
    const { viewCount, isReturningFromBack: viewCounterReturning } = useViewCounter({
        propertyId: property._id || String(property.propertyId)
    });

    // State restoration logic
    // Separate effect for state restoration
    useEffect(() => {
        if (isReturningFromBack && property && !hasRestoredState.current) {
            hasRestoredState.current = true;
            restorePropertyState();
        }
    }, [isReturningFromBack, property]);

    // State preservation functions
    const savePropertyState = () => {
        if (property) {
            const stateToSave = {
                scrollPosition: scrollPositionRef.current,
                isFavorite,
                timestamp: Date.now()
            };
            preserveState(`property_${property.propertyId || property._id}`, stateToSave);
        }
    };

    const restorePropertyState = () => {
        const key = `property_${property.propertyId || property._id}`;
        const savedState = getPreservedState(key);
        if (savedState) {
            // Restore favorite state
            setIsFavorite(savedState.isFavorite || false);

            // Restore scroll position after a short delay
            setTimeout(() => {
                if (savedState.scrollPosition > 0) {
                    window.scrollTo(0, savedState.scrollPosition);
                }
            }, 100);
        }
    };

    // Save scroll position on scroll
    useEffect(() => {
        const handleScroll = () => {
            scrollPositionRef.current = window.scrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Save state before navigation
    useEffect(() => {
        const handleBeforeUnload = () => {
            savePropertyState();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [property, isFavorite]);

    // Increment view count on mount (if not returning)
    useEffect(() => {
        if (!isReturningFromBack && property) {
            incrementPropertyView(String(property.propertyId || property._id)).catch(err => {
                console.error('Error incrementing view count:', err);
            });
        }
    }, [isReturningFromBack, property]);

    const handleBack = () => {
        // Don't save property state - we want to restore the main page state instead
        console.log('🔙 Property page: Going back to main page, preserving main page scroll position');
        goBack();
    };

    return (
        <>
            <StateRestoredIndicator show={showStateRestored} />

            <div className="min-h-screen bg-gray-50">
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
                                    <span>Back</span>
                                </button>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
                                    <p className="text-sm text-gray-500">{property.district}, {property.location}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => {
                                        setIsFavorite(!isFavorite);
                                        setTimeout(() => savePropertyState(), 100);
                                    }}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isFavorite
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

                {/* Property Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <PropertyDetail
                        property={property as any}
                        onClose={handleBack}
                        onPropertyClick={(recommendedProperty) => {
                            if (recommendedProperty) {
                                const targetUrl = getPropertyUrl(recommendedProperty);
                                console.log('🔍 Navigating to recommended property:', targetUrl);
                                router.push(targetUrl);
                            }
                        }}
                    />

                    {/* View Counter */}
                    <div className="mt-8 bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-sm text-gray-600">
                            This property has been viewed <span className="font-semibold text-blue-600">{viewCount}</span> times
                            {viewCounterReturning && (
                                <span className="ml-2 text-green-600 text-xs">(State preserved)</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
