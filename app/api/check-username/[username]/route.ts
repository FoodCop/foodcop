import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    
    // Basic validation
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({
        available: false,
        error: 'Username must be between 3 and 50 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    const supabase = await supabaseServer();
    
    // Check if username exists
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for available usernames
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    const isAvailable = !existingUser;

    return NextResponse.json({
      available: isAvailable,
      username: username,
      suggestions: !isAvailable ? generateUsernameSuggestions(username) : undefined
    });

  } catch (error) {
    console.error('Username check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateUsernameSuggestions(baseUsername: string): string[] {
  const suggestions: string[] = [];
  const numbers = [1, 2, 3, 123, 99, 2024];
  const suffixes = ['_', 'official', 'real', 'user'];

  // Add numeric suffixes
  for (const num of numbers) {
    suggestions.push(`${baseUsername}${num}`);
    suggestions.push(`${baseUsername}_${num}`);
  }

  // Add word suffixes
  for (const suffix of suffixes) {
    if (suffix === '_') {
      suggestions.push(`${baseUsername}${suffix}`);
    } else {
      suggestions.push(`${baseUsername}_${suffix}`);
    }
  }

  // Return first 5 unique suggestions
  return [...new Set(suggestions)].slice(0, 5);
}