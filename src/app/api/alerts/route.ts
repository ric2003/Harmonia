import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's alerts from Convex
    const userAlerts = await convex.query(api.alerts.list, { userId });
    
    return NextResponse.json(userAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stationId, type, threshold, channels } = body;

    // Validate input
    if (!stationId || !type || typeof threshold !== 'number' || !Array.isArray(channels)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Create or update alert in Convex
    const alertId = await convex.mutation(api.alerts.createOrUpdate, {
      userId,
      stationId,
      type: type as 'avgTemp',
      threshold,
      channels,
    });

    // Get the created/updated alert
    const userAlerts = await convex.query(api.alerts.list, { userId });
    const alertData = userAlerts.find(alert => alert.id === alertId);

    return NextResponse.json(alertData);
  } catch (error) {
    console.error('Error creating/updating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    // Delete alert from Convex
    await convex.mutation(api.alerts.remove, {
      alertId: alertId as any, // Type assertion needed for Convex ID
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

 