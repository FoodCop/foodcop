import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/debug/check-supabase-tables - Check what tables exist in Supabase
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase environment variables not configured',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('Error fetching tables:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch database tables',
        details: error.message
      }, { status: 500 });
    }

    // Check for chat-related tables
    const chatTables = tables?.filter(t => 
      t.table_name.includes('chat') || 
      t.table_name.includes('message') || 
      t.table_name.includes('conversation')
    ) || [];

    // Check for required tables
    const requiredTables = ['users', 'user_relationships', 'master_bots'];
    const existingRequired = requiredTables.filter(tableName =>
      tables?.some(t => t.table_name === tableName)
    );

    return NextResponse.json({
      success: true,
      allTables: tables?.map(t => t.table_name) || [],
      tableCount: tables?.length || 0,
      chatTables: chatTables.map(t => t.table_name),
      requiredTables: {
        needed: requiredTables,
        existing: existingRequired,
        missing: requiredTables.filter(t => !existingRequired.includes(t))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supabase check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}