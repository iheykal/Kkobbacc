import connectDB from './mongodb';
import Property from '@/models/Property';
import { initializePropertyCounter } from './propertyIdGenerator';

const sampleProperties = [
  {
    propertyId: 1,
    title: "Luxury Villa in Beverly Hills",
    location: "Beverly Hills, CA",
    price: 8500000,
    beds: 6,
    baths: 7,
    sqft: 8500,
    yearBuilt: 2020,
    lotSize: 15000,
    propertyType: "villa",
    status: "For Sale",
    description: "Stunning luxury villa with panoramic city views, featuring high-end finishes, smart home technology, and resort-style amenities.",
    features: ["Smart Home", "Wine Cellar", "Home Theater", "Gym", "Pool", "Spa"],
    amenities: ["Gated Community", "24/7 Security", "Concierge Service", "Valet Parking"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80"
    ],
    agent: {
      name: "Sarah Johnson",
      phone: "+1 (310) 555-0123",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80",
      rating: 5
    },
    featured: true
  },
  {
    propertyId: 2,
    title: "Modern Penthouse in Manhattan",
    location: "Manhattan, NY",
    price: 12500000,
    beds: 8,
    baths: 10,
    sqft: 12000,
    yearBuilt: 2022,
    lotSize: 0,
    propertyType: "penthouse",
    status: "For Sale",
    description: "Ultra-modern penthouse with floor-to-ceiling windows, rooftop terrace, and breathtaking city skyline views.",
    features: ["Rooftop Terrace", "Floor-to-Ceiling Windows", "Smart Home", "Wine Room", "Home Office"],
    amenities: ["Doorman", "Concierge", "Fitness Center", "Rooftop Pool", "Private Parking"],
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"
    ],
    agent: {
      name: "Michael Chen",
      phone: "+1 (212) 555-0456",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80",
      rating: 5
    },
    featured: true
  },
  {
    propertyId: 3,
    title: "Coastal Estate in Miami Beach",
    location: "Miami Beach, FL",
    price: 4200000,
    beds: 4,
    baths: 5,
    sqft: 6200,
    yearBuilt: 2019,
    lotSize: 12000,
    propertyType: "estate",
    status: "For Sale",
    description: "Stunning coastal estate with direct ocean access, private beach, and tropical landscaping.",
    features: ["Private Beach Access", "Ocean Views", "Tropical Garden", "Pool", "Boat Dock"],
    amenities: ["Gated Entry", "Security System", "Irrigation System", "Outdoor Kitchen"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    ],
    agent: {
      name: "Elena Rodriguez",
      phone: "+1 (305) 555-0789",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=774&q=80",
      rating: 5
    },
    featured: false
  }
];

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await Property.deleteMany({});
    
    // Insert sample properties
    const properties = await Property.insertMany(sampleProperties);
    
    // Initialize the property counter to start from the next available ID
    await initializePropertyCounter();
    
    console.log(`Successfully seeded ${properties.length} properties`);
    return properties;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Function to add a single property
export async function addProperty(propertyData: any) {
  try {
    await connectDB();
    
    const property = new Property(propertyData);
    await property.save();
    
    console.log('Property added successfully:', property.title);
    return property;
  } catch (error) {
    console.error('Error adding property:', error);
    throw error;
  }
}
