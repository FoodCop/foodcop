import { NextResponse } from 'next/server';
import { initializeCronJobs } from '@/lib/cron/init';

export async function POST() {
  try {
    await initializeCronJobs();
    return NextResponse.json({
      success: true,
      message: 'CRON jobs initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing CRON jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize CRON jobs'
    }, { status: 500 });
  }
}