import { NextResponse } from 'next/server';
import { CronLogger } from '@/lib/cron';

export async function GET() {
  try {
    const logger = CronLogger.getInstance();
    const logs = logger.getLogs(undefined, 100);
    
    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching CRON logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch CRON logs'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const logger = CronLogger.getInstance();
    logger.clearLogs();
    
    return NextResponse.json({
      success: true,
      message: 'Logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing CRON logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear CRON logs'
    }, { status: 500 });
  }
}