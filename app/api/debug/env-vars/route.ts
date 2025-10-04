import { NextResponse } from "next/server";

export async function GET() {
  try {
    const requiredEnvVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY ? '[HIDDEN]' : undefined,
      'GOOGLE_MAPS_API_KEY': process.env.GOOGLE_MAPS_API_KEY ? '[HIDDEN]' : undefined,
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '[HIDDEN]' : undefined,
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '[HIDDEN]' : undefined,
      'SPOONACULAR_API_KEY': process.env.SPOONACULAR_API_KEY ? '[HIDDEN]' : undefined,
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY ? '[HIDDEN]' : undefined,
      'YOUTUBE_API_KEY': process.env.YOUTUBE_API_KEY ? '[HIDDEN]' : undefined
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    return NextResponse.json({
      success: missingVars.length === 0,
      timestamp: new Date().toISOString(),
      envVars: requiredEnvVars, // Changed from 'environment' to 'envVars' to match debug service
      missing: missingVars,
      nodeEnv: process.env.NODE_ENV,
      message: missingVars.length > 0 
        ? `Missing environment variables: ${missingVars.join(', ')}`
        : 'All required environment variables are set'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}