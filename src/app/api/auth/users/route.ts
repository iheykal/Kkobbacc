import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { createListFilter } from '@/lib/authz/authorize';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get session for authorization
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create authorization filter for users list
    const authFilter = createListFilter(session.role, 'read', 'user', session.userId);
    
    // Build query with authorization filter
    const query = { ...authFilter };
    
    // Exclude password fields from response
    const users = await User.find(query, { 
      passwordHash: 0, 
      'security.passwordResetTokenHash': 0,
      'security.twoFactorSecret': 0 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      count: users.length,
      data: users 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
