import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';

export async function POST(request: NextRequest) {
  try {
    const properties = await seedDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: `Database seeded successfully with ${properties.length} properties`,
      data: properties 
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
