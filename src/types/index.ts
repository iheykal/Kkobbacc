export interface Property {
  id: string
  title: string
  description: string
  price: number
  district: string
  listingType?: string
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  details: {
    bedrooms: number
    bathrooms: number
    squareFeet: number
    lotSize: number
    yearBuilt: number
    propertyType: PropertyType
    status: PropertyStatus
  }
  amenities: string[]
  images: PropertyImage[]
  agent: Agent
  createdAt: Date
  updatedAt: Date
  featured: boolean
  tags: string[]
}

export interface PropertyImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  caption?: string
}

export interface Agent {
  id: string
  name: string
  phone: string
  avatar?: string
  bio: string
  specialties: string[]
  experience: number
  certifications: string[]
  languages: string[]
}

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
  preferences: UserPreferences
  savedProperties: string[]
  createdAt: Date
}

export interface UserPreferences {
  priceRange: {
    min: number
    max: number
  }
  propertyTypes: PropertyType[]
  locations: string[]
  amenities: string[]
  notifications: boolean
}

export type PropertyType = 
  | 'single-family'
  | 'condo'
  | 'townhouse'
  | 'luxury'
  | 'penthouse'
  | 'villa'
  | 'dabaq'
  | 'mansion'
  | 'estate'

export type PropertyStatus = 
  | 'For Sale'
  | 'For Rent'
  | 'Sold'
  | 'Rented'
  | 'Pending'
  | 'Off Market'

export type UserRole = 
  | 'buyer'
  | 'seller'
  | 'agent'
  | 'admin'

export interface SearchFilters {
  query?: string
  location?: string
  priceRange?: {
    min: number
    max: number
  }
  propertyType?: PropertyType[]
  bedrooms?: number
  bathrooms?: number
  squareFeet?: {
    min: number
    max: number
  }
  amenities?: string[]
  yearBuilt?: {
    min: number
    max: number
  }
}

export interface ContactForm {
  name: string
  phone: string
  message: string
  propertyId?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
