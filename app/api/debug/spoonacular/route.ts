import { NextResponse } from "next/server";

export async function GET() {
  try {
    const spoonacularKey = process.env.SPOONACULAR_API_KEY;
    
    if (!spoonacularKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Spoonacular API key not configured',
          message: 'SPOONACULAR_API_KEY environment variable is missing'
        },
        { status: 500 }
      );
    }

    // Test Spoonacular API with a simple recipe search
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=pasta&number=1&apiKey=${spoonacularKey}`);
    const data = await response.json();

    if (response.ok && data.results) {
      return NextResponse.json({
        success: true,
        message: 'Spoonacular API is accessible',
        results_count: data.results.length,
        total_results: data.totalResults,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Spoonacular API request failed',
          message: data.message || 'API request failed',
          status: response.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Spoonacular API test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Spoonacular API request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}