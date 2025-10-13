import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await supabaseServer();
    
    // Test basic collections - these would be your main app tables
    const collections = [
      { name: 'saved_items', description: 'User saved recipes and restaurants' },
      { name: 'users', description: 'User profiles and settings' },
      { name: 'friendships', description: 'User friend connections' },
      { name: 'shares', description: 'Content shared between friends' }
    ];

    let accessibleCollections = [];
    let errors = [];

    for (const collection of collections) {
      try {
        // Test if we can access each collection
        const { error } = await supabase
          .from(collection.name)
          .select('*')
          .limit(1);

        if (error) {
          errors.push({
            collection: collection.name,
            error: error.message
          });
        } else {
          accessibleCollections.push(collection);
        }
      } catch (err) {
        errors.push({
          collection: collection.name,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Collections accessibility test completed',
      accessible_collections: accessibleCollections,
      accessible_count: accessibleCollections.length,
      errors: errors,
      total_tested: collections.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Collections test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Collections test failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}