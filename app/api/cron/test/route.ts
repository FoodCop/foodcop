import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Log for debugging
  console.log('CRON Test endpoint hit:', {
    timestamp: new Date().toISOString(),
    hasAuth: !!authHeader,
    hasCronSecret: !!cronSecret,
    userAgent: request.headers.get('user-agent'),
    method: 'GET'
  });

  // Verify CRON secret for production
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized CRON request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'CRON test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSecret: !!cronSecret
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Log for debugging
  console.log('CRON Test endpoint hit via POST:', {
    timestamp: new Date().toISOString(),
    hasAuth: !!authHeader,
    hasCronSecret: !!cronSecret,
    userAgent: request.headers.get('user-agent'),
    method: 'POST'
  });

  // Verify CRON secret for production
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized CRON request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'CRON test POST successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSecret: !!cronSecret
  });
}