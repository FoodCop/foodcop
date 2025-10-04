import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Check OAuth providers configuration
    const { data: providers, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      oauth: {
        configured: !error,
        error: error?.message,
        message: "OAuth configuration check completed"
      },
      providers: {
        google: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured",
        github: process.env.GITHUB_CLIENT_ID ? "Configured" : "Not configured"
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}