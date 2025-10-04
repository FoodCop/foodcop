"use client";

import { useEffect, useState } from "react";

function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Permission denied - Please allow location access";
    case 2:
      return "Position unavailable - Unable to determine location";
    case 3:
      return "Request timeout - Location request timed out";
    default:
      return "Unknown geolocation error";
  }
}

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  location_city?: string;
  location_country?: string;
  total_points: number;
  followers_count: number;
  following_count: number;
  is_master_bot: boolean;
  created_at: string;
  updated_at: string;
}

export function FeedDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnections = async () => {
      const info: any = {};

      // Get current geolocation
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            });
          });
          
          info.geolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          };
          setGeolocationError(null);
        } catch (error) {
          info.geolocation = null;
          const errorMessage = error instanceof GeolocationPositionError 
            ? getGeolocationErrorMessage(error.code)
            : error instanceof Error ? error.message : "Unknown geolocation error";
          setGeolocationError(errorMessage);
        }
      } else {
        info.geolocation = null;
        setGeolocationError("Geolocation is not supported by this browser");
      }

      // Check environment variables through server-side API
      try {
        const envResponse = await fetch("/api/debug/env-vars");
        const envData = await envResponse.json();
        // Map API response to component expected format
        info.envVars = {
          supabaseUrl: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!envData.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          googleMapsKey: !!envData.envVars?.GOOGLE_MAPS_API_KEY,
          spoonacularKey: !!envData.envVars?.SPOONACULAR_API_KEY,
          openaiKey: !!envData.envVars?.OPENAI_API_KEY,
        };
      } catch (error) {
        // Fallback to client-side check for public variables only
        info.envVars = {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          googleMapsKey: false,
          spoonacularKey: false,
          openaiKey: false,
        };
      }

      // Test Supabase connection
      try {
        const response = await fetch("/api/debug/supabase");
        const data = await response.json();
        info.supabaseConnection = data.success;
        info.supabaseError = data.error;
      } catch (error) {
        info.supabaseConnection = false;
        info.supabaseError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test Google Places API
      try {
        const response = await fetch("/api/debug/google-places");
        const data = await response.json();
        info.googlePlacesConnection = data.success;
        info.googlePlacesError = data.error;
      } catch (error) {
        info.googlePlacesConnection = false;
        info.googlePlacesError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test Spoonacular API
      try {
        const response = await fetch("/api/debug/spoonacular");
        const data = await response.json();
        info.spoonacularConnection = data.success;
        info.spoonacularError = data.error;
      } catch (error) {
        info.spoonacularConnection = false;
        info.spoonacularError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test OAuth configuration
      try {
        const response = await fetch("/api/debug/oauth");
        const data = await response.json();
        info.oauthConfig = data.success;
        info.oauthError = data.error;
      } catch (error) {
        info.oauthConfig = false;
        info.oauthError = error instanceof Error ? error.message : "Unknown error";
      }

      // Test Reverse Geocoding if we have location data
      if (info.geolocation) {
        try {
          const response = await fetch(`/api/debug/google-maps?lat=${info.geolocation.latitude}&lng=${info.geolocation.longitude}`);
          const data = await response.json();
          info.geocoding = {
            success: data.success,
            locationName: data.locationName || data.formatted_address || data.address || 'Location name not available',
            error: data.error
          };
        } catch (error) {
          info.geocoding = {
            success: false,
            locationName: null,
            error: error instanceof Error ? error.message : "Reverse geocoding error"
          };
        }
      } else {
        info.geocoding = {
          success: false,
          locationName: null,
          error: "No location data available"
        };
      }

      setDebugInfo(info);
      setLoading(false);
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/debug/users");
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setUsersError(data.error || "Failed to fetch users");
        }
      } catch (err) {
        setUsersError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setUsersLoading(false);
      }
    };

    checkConnections();
    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <h3>Feed Page Debug Information</h3>
      
      <h4>Current Location:</h4>
      {debugInfo.geolocation ? (
        <ul>
          <li>Latitude: {debugInfo.geolocation.latitude.toFixed(6)}</li>
          <li>Longitude: {debugInfo.geolocation.longitude.toFixed(6)}</li>
          <li>Accuracy: {debugInfo.geolocation.accuracy.toFixed(0)} meters</li>
          <li>Timestamp: {debugInfo.geolocation.timestamp}</li>
          {debugInfo.geocoding?.locationName && (
            <li>Location: <strong>{debugInfo.geocoding.locationName}</strong></li>
          )}
          {debugInfo.geocoding?.error && (
            <li style={{ color: "red" }}>Geocoding Error: {debugInfo.geocoding.error}</li>
          )}
          <li>
            <a 
              href={`https://www.google.com/maps?q=${debugInfo.geolocation.latitude},${debugInfo.geolocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#047DD4" }}
            >
              View on Google Maps
            </a>
          </li>
        </ul>
      ) : (
        <ul>
          <li style={{ color: "red" }}>
            Location: {geolocationError || "Unable to get location"}
          </li>
        </ul>
      )}
      
      <h4>Environment Variables:</h4>
      <ul>
        <li>Supabase URL: {debugInfo.envVars?.supabaseUrl ? "LOADED" : "MISSING"}</li>
        <li>Supabase Anon Key: {debugInfo.envVars?.supabaseAnonKey ? "LOADED" : "MISSING"}</li>
        <li>Google Maps Key: {debugInfo.envVars?.googleMapsKey ? "LOADED" : "MISSING"}</li>
        <li>Spoonacular Key: {debugInfo.envVars?.spoonacularKey ? "LOADED" : "MISSING"}</li>
        <li>OpenAI Key: {debugInfo.envVars?.openaiKey ? "LOADED" : "MISSING"}</li>
      </ul>

      <h4>API Connections:</h4>
      <ul>
        <li>Supabase: {debugInfo.supabaseConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.supabaseError && <li>Supabase Error: {debugInfo.supabaseError}</li>}
        
        <li>Google Places: {debugInfo.googlePlacesConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.googlePlacesError && <li>Google Places Error: {debugInfo.googlePlacesError}</li>}
        
        <li>Spoonacular: {debugInfo.spoonacularConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.spoonacularError && <li>Spoonacular Error: {debugInfo.spoonacularError}</li>}
        
        <li>OAuth Config: {debugInfo.oauthConfig ? "CONFIGURED" : "FAILED"}</li>
        {debugInfo.oauthError && <li>OAuth Error: {debugInfo.oauthError}</li>}
      </ul>

      <h4>Users Debug Information:</h4>
      {usersLoading ? (
        <p>Loading users...</p>
      ) : usersError ? (
        <p style={{ color: "red" }}>Error: {usersError}</p>
      ) : (
        <div>
          <p><strong>Total Users:</strong> {users.length}</p>
          {users.length > 0 && (
            <div style={{ 
              maxHeight: "400px", 
              overflowY: "auto", 
              border: "1px solid #ccc", 
              borderRadius: "4px",
              marginTop: "10px"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                fontSize: "12px",
                fontFamily: "monospace"
              }}>
                <thead style={{ backgroundColor: "#f5f5f5", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Username</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Display Name</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Email</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Location</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Points</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Social</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ padding: "6px", border: "1px solid #ddd", fontSize: "10px" }}>
                        {user.id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.username || 'N/A'}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.display_name || 'N/A'}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.email || 'N/A'}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.location_city || user.location_country ? 
                          `${user.location_city || ''} ${user.location_country || ''}`.trim() : 'N/A'}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.total_points || 0}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.followers_count || 0}/{user.following_count || 0}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd" }}>
                        {user.is_master_bot ? '🤖 Bot' : '👤 User'}
                        {user.bio && <span style={{ color: '#666' }}> • Bio</span>}
                        {user.avatar_url && <span style={{ color: '#666' }}> • Avatar</span>}
                      </td>
                      <td style={{ padding: "6px", border: "1px solid #ddd", fontSize: "10px" }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
