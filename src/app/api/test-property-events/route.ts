import { NextRequest, NextResponse } from 'next/server';
import { propertyEventManager } from '@/lib/propertyEvents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, propertyId } = body;
    
    console.log('🧪 Testing property event:', { eventType, propertyId });
    
    switch (eventType) {
      case 'added':
        propertyEventManager.notifyAdded(propertyId);
        break;
      case 'updated':
        propertyEventManager.notifyUpdated(propertyId);
        break;
      case 'deleted':
        propertyEventManager.notifyDeleted(propertyId);
        break;
      case 'refresh':
        propertyEventManager.notifyRefresh();
        break;
      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: `Event ${eventType} triggered` });
  } catch (error) {
    console.error('Error testing property events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
