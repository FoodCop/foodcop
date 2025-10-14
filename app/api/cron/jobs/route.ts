import { NextRequest, NextResponse } from 'next/server';
import { CronScheduler, CronLogger } from '@/lib/cron';

export async function GET() {
  try {
    const scheduler = CronScheduler.getInstance();
    const jobs = scheduler.getAllJobs();
    const stats = scheduler.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        jobs: Array.from(jobs.values()),
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching CRON jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch CRON jobs'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const jobConfig = await request.json();
    const scheduler = CronScheduler.getInstance();
    const success = scheduler.addJob(jobConfig);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Job added successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to add job'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error adding CRON job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add CRON job'
    }, { status: 500 });
  }
}