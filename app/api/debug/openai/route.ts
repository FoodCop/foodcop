import { NextResponse } from "next/server";

export async function GET() {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured',
          message: 'OPENAI_API_KEY environment variable is missing'
        },
        { status: 500 }
      );
    }

    // Test OpenAI API with a simple completion request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'OpenAI API is accessible',
        models_available: data.data?.length || 0,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API request failed',
          message: data.error?.message || 'API request failed',
          status: response.status
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('OpenAI API test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'OpenAI API request failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}