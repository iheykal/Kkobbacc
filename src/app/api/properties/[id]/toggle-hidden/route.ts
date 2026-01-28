import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Property from '@/models/Property';
import { getSessionFromRequest } from '@/lib/sessionUtils';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        // Get session for authorization
        const session = getSessionFromRequest(request);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only superadmin can hide/show properties
        if (session.role !== 'superadmin') {
            return NextResponse.json({
                success: false,
                error: 'Forbidden: Only superadmin can hide/show properties'
            }, { status: 403 });
        }

        const propertyId = params.id;

        // Parse request body to get the desired hidden state
        const body = await request.json();
        const { isHidden } = body;

        if (typeof isHidden !== 'boolean') {
            return NextResponse.json({
                success: false,
                error: 'Invalid request: isHidden must be a boolean'
            }, { status: 400 });
        }

        // Find and update the property
        const property = await Property.findByIdAndUpdate(
            propertyId,
            { isHidden },
            { new: true } // Return the updated document
        );

        if (!property) {
            return NextResponse.json({
                success: false,
                error: 'Property not found'
            }, { status: 404 });
        }

        console.log(`✅ Property ${propertyId} visibility toggled: isHidden=${isHidden}`);

        return NextResponse.json({
            success: true,
            data: {
                propertyId: property._id,
                isHidden: property.isHidden
            }
        });

    } catch (error) {
        console.error('❌ Error toggling property visibility:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to toggle property visibility'
            },
            { status: 500 }
        );
    }
}
