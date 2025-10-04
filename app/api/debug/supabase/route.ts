import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Test Supabase connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Test database connection
    const { data: tables, error: dbError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      auth: {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message
      },
      database: {
        tables: tables?.map(t => t.table_name) || [],
        error: dbError?.message
      },
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
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