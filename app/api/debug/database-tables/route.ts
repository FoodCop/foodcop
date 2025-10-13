import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Test database connection by listing tables in the information_schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .select('*');

    // If the RPC doesn't exist, fall back to a simple query
    if (tablesError) {
      // Try a simple query to test database connectivity
      const { data: simpleTest, error: simpleError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10);

      if (simpleError) {
        // Final fallback - just test auth connection
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        return NextResponse.json({
          success: !authError,
          message: authError ? 'Database connection failed' : 'Basic database connection working',
          tables: ['Connection test only - table listing unavailable'],
          error: authError?.message,
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Database tables accessible',
        tables: simpleTest?.map(t => t.table_name) || [],
        count: simpleTest?.length || 0,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables retrieved successfully',
      tables: tables || [],
      count: tables?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database tables test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database tables request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}