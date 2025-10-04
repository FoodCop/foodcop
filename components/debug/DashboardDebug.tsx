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

interface DebugResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

interface DebugInfo {
  envVars: {
    [key: string]: boolean;
  };
  apiConnections: {
    [key: string]: DebugResult;
  };
  geolocation: {
    supported: boolean;
    position?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: string;
    };
    error?: string;
  };
  geocoding: {
    success: boolean;
    locationName?: string;
    results?: any;
    error?: string;
  };
  database: {
    connection: boolean;
    tables?: { [tableName: string]: { status: string; count?: number; error?: string } };
    error?: string;
  };
}

export function DashboardDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    envVars: {},
    apiConnections: {},
    geolocation: { supported: false },
    geocoding: { success: false, locationName: undefined },
    database: { connection: false }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runAllTests = async () => {
      const info: DebugInfo = {
        envVars: {},
        apiConnections: {},
        geolocation: { supported: false },
        geocoding: { success: false, locationName: undefined },
        database: { connection: false }
      };

      // Test Environment Variables through server-side API
      try {
        const envResponse = await fetch("/api/debug/env-vars");
        const envData = await envResponse.json();
        info.envVars = envData.envVars;
      } catch (error) {
        // Fallback to client-side check for public variables only
        info.envVars = {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseServiceKey: false,
          googleMapsKey: false,
          googleClientId: false,
          googleClientSecret: false,
          youtubeApiKey: false,
          spoonacularKey: false,
          openaiKey: false,
          streamApiKey: false,
          streamSecret: false,
          streamWebhookSecret: false,
        };
      }

      // Test API Connections
      const apiEndpoints = [
        'supabase',
        'google-maps',
        'google-places',
        'openai',
        'spoonacular',
        'youtube',
        'supabase-storage',
        'database-tables',
        'collections'
      ];

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(`/api/debug/${endpoint}`);
          const data = await response.json();
          info.apiConnections[endpoint] = {
            success: data.success,
            message: data.message,
            error: data.error,
            data: data
          };
        } catch (error) {
          info.apiConnections[endpoint] = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      }

      // Test Geolocation
      if (navigator.geolocation) {
        info.geolocation.supported = true;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5 minutes
            });
          });
          info.geolocation.position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          };
        } catch (error) {
          const errorMessage = error instanceof GeolocationPositionError 
            ? getGeolocationErrorMessage(error.code)
            : error instanceof Error ? error.message : "Unknown geolocation error";
          info.geolocation.error = errorMessage;
        }
      }

      // Test Reverse Geocoding if we have location data
      if (info.geolocation.position) {
        try {
          const response = await fetch(`/api/debug/google-maps?lat=${info.geolocation.position.latitude}&lng=${info.geolocation.position.longitude}`);
          const data = await response.json();
          info.geocoding.success = data.success;
          info.geocoding.results = data;
          info.geocoding.locationName = data.locationName || data.formatted_address || data.address || 'Location name not available';
          info.geocoding.error = data.error;
        } catch (error) {
          info.geocoding.error = error instanceof Error ? error.message : "Reverse geocoding error";
        }
      }

      // Test Database Access
      try {
        const response = await fetch(`/api/debug/supabase`);
        const data = await response.json();
        info.database.connection = data.success;
        info.database.error = data.error;
      } catch (error) {
        info.database.error = error instanceof Error ? error.message : "Database error";
      }

      // Get Database Tables
      try {
        const response = await fetch(`/api/debug/database-tables`);
        const data = await response.json();
        if (data.success && data.tables) {
          info.database.tables = data.tables;
        }
      } catch (error) {
        // Tables info is optional, don't fail the whole test
      }

      setDebugInfo(info);
      setLoading(false);
    };

    runAllTests();
  }, []);

  const testGeolocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      alert(`Geolocation test: SUCCESS\nLat: ${position.coords.latitude}\nLng: ${position.coords.longitude}\nAccuracy: ${position.coords.accuracy}m`);
    } catch (error) {
      const errorMessage = error instanceof GeolocationPositionError 
        ? getGeolocationErrorMessage(error.code)
        : error instanceof Error ? error.message : 'Unknown error';
      alert(`Geolocation test failed: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <h3>Dashboard Debug Information</h3>
      
      {/* Environment Variables */}
      <h4>Environment Variables:</h4>
      <ul>
        {Object.entries(debugInfo.envVars || {}).map(([key, value]) => (
          <li key={key}>
            {key}: {value ? "LOADED" : "MISSING"}
          </li>
        ))}
      </ul>

      {/* API Connections */}
      <h4>API Connections:</h4>
      <ul>
        {Object.entries(debugInfo.apiConnections || {}).map(([endpoint, result]) => (
          <li key={endpoint}>
            {endpoint}: {result.success ? "CONNECTED" : "FAILED"}
            {result.error && <span style={{ color: "red" }}> - {result.error}</span>}
          </li>
        ))}
      </ul>

      {/* Database */}
      <h4>Database Access:</h4>
      <ul>
        <li>Connection: {debugInfo.database.connection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.database.error && <li style={{ color: "red" }}>Error: {debugInfo.database.error}</li>}
        {debugInfo.database.tables && (
          <li>Tables: {Object.keys(debugInfo.database.tables).map(table => {
            const tableInfo = debugInfo.database.tables![table];
            return `${table} (${tableInfo.status === 'success' 
              ? `${tableInfo.count || 0} rows` 
              : 'error'})`;
          }).join(", ")}</li>
        )}
      </ul>

      {/* Geolocation */}
      <h4>Current Location:</h4>
      {debugInfo.geolocation.position ? (
        <ul>
          <li>Latitude: {debugInfo.geolocation.position.latitude.toFixed(6)}</li>
          <li>Longitude: {debugInfo.geolocation.position.longitude.toFixed(6)}</li>
          <li>Accuracy: {debugInfo.geolocation.position.accuracy.toFixed(0)} meters</li>
          <li>Timestamp: {debugInfo.geolocation.position.timestamp}</li>
          <li>
            <a 
              href={`https://www.google.com/maps?q=${debugInfo.geolocation.position.latitude},${debugInfo.geolocation.position.longitude}`}
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
          <li>Supported: {debugInfo.geolocation.supported ? "YES" : "NO"}</li>
          {debugInfo.geolocation.error && <li style={{ color: "red" }}>Error: {debugInfo.geolocation.error}</li>}
        </ul>
      )}
      <button onClick={testGeolocation} style={{ margin: "5px", padding: "5px 10px" }}>
        Test Geolocation
      </button>

      {/* Geocoding */}
      <h4>Location Information:</h4>
      <ul>
        <li>Status: {debugInfo.geocoding.success ? "WORKING" : "FAILED"}</li>
        {debugInfo.geocoding.locationName && (
          <li>Location: <strong>{debugInfo.geocoding.locationName}</strong></li>
        )}
        {debugInfo.geocoding.error && <li style={{ color: "red" }}>Error: {debugInfo.geocoding.error}</li>}
      </ul>

      {/* Summary */}
      <h4>Summary:</h4>
      <ul>
        <li>
          Environment Variables: {Object.values(debugInfo.envVars || {}).filter(Boolean).length} / {Object.keys(debugInfo.envVars || {}).length} loaded
        </li>
        <li>
          API Connections: {Object.values(debugInfo.apiConnections || {}).filter(r => r.success).length} / {Object.keys(debugInfo.apiConnections || {}).length} connected
        </li>
        <li>
          Database: {debugInfo.database.connection ? "Connected" : "Failed"}
        </li>
        <li>
          Location Services: {debugInfo.geolocation.supported ? "Supported" : "Not Supported"}
        </li>
      </ul>
    </div>
  );
}
