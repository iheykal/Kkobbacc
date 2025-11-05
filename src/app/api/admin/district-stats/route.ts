import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import Property from '@/models/Property';
import connectToDatabase from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization - only superadmin can access this
    const normalizedRole = session.role === 'super_admin' ? 'superadmin' : session.role;
    
    if (normalizedRole !== 'superadmin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Only superadmin can access this endpoint' 
      }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Aggregate properties by district
    const districtStats = await Property.aggregate([
      {
        $match: {
          deletionStatus: { $ne: 'deleted' } // Exclude deleted properties
        }
      },
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Transform data for the chart
    const chartData = districtStats.map(stat => ({
      name: stat._id || 'Unknown',
      value: stat.count,
      totalValue: stat.totalValue,
      avgPrice: Math.round(stat.avgPrice || 0)
    }));

    // Calculate summary
    const summary = {
      totalProperties: chartData.reduce((sum, item) => sum + item.value, 0),
      totalValue: chartData.reduce((sum, item) => sum + item.totalValue, 0),
      totalDistricts: chartData.length
    };

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching district stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch district statistics' },
      { status: 500 }
    );
  }
}