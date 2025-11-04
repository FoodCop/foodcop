/**
 * Supabase Edge Function: make-server-5976446e
 * 
 * Main backend API server for FuzoFoodCop
 * Handles all backend API calls including Google APIs, health checks, etc.
 * 
 * Setup:
 * 1. Set environment variables in Supabase:
 *    - GOOGLE_MAPS_API_KEY
 *    - OPENAI_API_KEY
 *    - SPOONACULAR_API_KEY
 * 2. Deploy: supabase functions deploy make-server-5976446e
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/make-server-5976446e', '')

    console.log('📍 Request:', req.method, path)

    // Health check endpoint
    if (path === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          openai_configured: !!Deno.env.get('OPENAI_API_KEY'),
          google_maps_configured: !!Deno.env.get('GOOGLE_MAPS_API_KEY'),
          supabase_configured: !!Deno.env.get('SUPABASE_URL'),
          spoonacular_configured: !!Deno.env.get('SPOONACULAR_API_KEY'),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Routes API v2 - Directions endpoint
    if (path === '/directions') {
      const requestBody = await req.json()
      
      const GOOGLE_ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')

      if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured')
      }

      console.log('🗺️ Requesting directions from Google Routes API v2')

      const response = await fetch(GOOGLE_ROUTES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.bounds,routes.warnings'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      // Check if the API returned an error
      if (data.error) {
        console.error('Google Routes API error:', data.error)
        return new Response(
          JSON.stringify({
            status: 'ERROR',
            error: data.error.message || 'Unknown error from Google Routes API'
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Transform Routes API v2 response to match frontend expectations
      const transformedResponse = {
        status: data.routes && data.routes.length > 0 ? 'OK' : 'ZERO_RESULTS',
        routes: data.routes || []
      }

      console.log('✅ Directions retrieved:', transformedResponse.routes.length, 'route(s)')

      return new Response(
        JSON.stringify(transformedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Places Nearby Search
    if (path === '/places/nearby') {
      const requestBody = await req.json()
      const { latitude, longitude, radius, type } = requestBody

      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
      if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured')
      }

      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`

      console.log('🔍 Searching nearby places:', { latitude, longitude, radius, type })
      console.log('📍 Google Places URL (without key):', placesUrl.replace(GOOGLE_API_KEY, 'HIDDEN'))

      const response = await fetch(placesUrl)
      const data = await response.json()

      console.log('📊 Google Places response status:', data.status)
      console.log('📊 Google Places results count:', data.results?.length || 0)
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('❌ Google Places API error:', data.status, data.error_message)
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Places Text Search
    if (path === '/places/textsearch') {
      const requestBody = await req.json()
      const { query, location, radius } = requestBody

      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
      if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured')
      }

      let placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
      
      if (location) {
        placesUrl += `&location=${location.lat},${location.lng}`
      }
      
      if (radius) {
        placesUrl += `&radius=${radius}`
      }

      console.log('🔍 Text searching places:', query)

      const response = await fetch(placesUrl)
      const data = await response.json()

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Places Details
    if (path === '/places/details') {
      const requestBody = await req.json()
      const { place_id } = requestBody

      const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
      if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY not configured')
      }

      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_API_KEY}`

      console.log('📍 Fetching place details')

      const response = await fetch(detailsUrl)
      const data = await response.json()

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Endpoint not found
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint not found',
        path: path,
        available_endpoints: ['/health', '/directions', '/places/nearby', '/places/textsearch', '/places/details']
      }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
