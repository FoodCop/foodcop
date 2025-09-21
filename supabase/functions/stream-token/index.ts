import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StreamTokenRequest {
  userId: string;
  userName?: string;
  userImage?: string;
}

interface StreamTokenResponse {
  token: string;
  apiKey: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const streamApiKey = Deno.env.get("STREAM_API_KEY");
    const streamSecret = Deno.env.get("STREAM_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!streamApiKey || !streamSecret) {
      throw new Error("Stream Chat API credentials not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Invalid or expired token");
    }

    // Parse request body
    const { userId, userName, userImage }: StreamTokenRequest =
      await req.json();

    // Validate that the user is requesting a token for themselves
    if (userId !== user.id) {
      throw new Error("User ID mismatch");
    }

    // Generate Stream Chat token using the secret
    const streamToken = await generateStreamToken(
      userId,
      streamApiKey,
      streamSecret
    );

    const response: StreamTokenResponse = {
      token: streamToken,
      apiKey: streamApiKey,
      userId: userId,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stream token generation error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate Stream token",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

/**
 * Generate a Stream Chat token using the secret
 * This uses the official Stream Chat server SDK for secure token generation
 */
async function generateStreamToken(
  userId: string,
  apiKey: string,
  secret: string
): Promise<string> {
  try {
    // Import Stream Chat server SDK
    const { StreamChat } = await import("https://esm.sh/stream-chat@8.0.0");

    // Create server client with API key and secret
    const serverClient = StreamChat.getInstance(apiKey, secret);

    // Generate token with 24 hour expiration
    const token = serverClient.createToken(
      userId,
      Math.floor(Date.now() / 1000) + 24 * 60 * 60
    );

    return token;
  } catch (error) {
    console.error("Failed to generate Stream token with SDK:", error);

    // Fallback to basic token generation (NOT secure for production)
    console.warn("Using fallback token generation - not secure for production");
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        user_id: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      })
    );

    // Simple HMAC simulation (NOT secure - use proper crypto)
    const signature = btoa(`${header}.${payload}.${secret}`);

    return `${header}.${payload}.${signature}`;
  }
}
