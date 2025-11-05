import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }
    
    // Find the property with populated agent data
    const property = await Property.findById(propertyId)
      .populate('agentId', 'firstName lastName email phone avatar licenseNumber fullName')
      .select('propertyId title agentId agent createdAt');
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Get the raw property data
    const rawProperty = property.toObject();
    
    // Get the populated agent data
    const populatedAgent = rawProperty.agentId;
    
    // Get the embedded agent data
    const embeddedAgent = rawProperty.agent;
    
    return NextResponse.json({
      success: true,
      data: {
        property: {
          id: property._id,
          propertyId: property.propertyId,
          title: property.title,
          createdAt: property.createdAt
        },
        populatedAgent: populatedAgent ? {
          id: (populatedAgent as any)?._id ?? (populatedAgent as any),
          firstName: (populatedAgent as any)?.firstName,
          lastName: (populatedAgent as any)?.lastName,
          fullName: (populatedAgent as any)?.fullName,
          email: (populatedAgent as any)?.email,
          phone: (populatedAgent as any)?.phone,
          avatar: (populatedAgent as any)?.avatar,
          licenseNumber: (populatedAgent as any)?.licenseNumber
        } : null,
        embeddedAgent: embeddedAgent ? {
          name: embeddedAgent.name,
          phone: embeddedAgent.phone,
          image: embeddedAgent.image,
          rating: embeddedAgent.rating
        } : null,
        debug: {
          hasPopulatedAgent: !!populatedAgent,
          hasEmbeddedAgent: !!embeddedAgent,
          agentIdType: typeof rawProperty.agentId,
          agentType: typeof rawProperty.agent
        }
      }
    });
    
  } catch (error) {
    console.error('Error in test property agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
