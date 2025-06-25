import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await context.params;
    const body = await request.json();

    // Update the alert last triggered time in Convex
    await convex.mutation(api.alerts.updateLastTriggered, {
      alertId: alertId as any, // Type assertion needed for Convex ID
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 