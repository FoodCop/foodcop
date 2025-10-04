import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Test Supabase Storage functionality
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Storage access failed',
          message: bucketsError.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Storage is accessible',
      buckets: buckets?.map(b => b.name) || [],
      buckets_count: buckets?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supabase Storage test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Storage test failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}