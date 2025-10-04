"use client";

import { useEffect, useState } from "react";
import { debugService, DebugStatus } from "@/lib/debug-service";

interface BaseDebugProps {
  title: string;
  pageSpecificFeatures?: React.ReactNode;
}

export function BaseDebug({ title, pageSpecificFeatures }: BaseDebugProps) {
  const [debugStatus, setDebugStatus] = useState<DebugStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const status = await debugService.getDebugStatus();
        setDebugStatus(status);
      } catch (error) {
        console.error("Failed to load debug status:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const status = await debugService.refreshStatus();
      setDebugStatus(status);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>Loading debug information...</div>;
  }

  if (!debugStatus) {
    return <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>Failed to load debug information</div>;
  }

  const healthSummary = debugService.getHealthSummary(debugStatus);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>{title}</h3>
        <button 
          onClick={refreshStatus}
          style={{
            padding: "8px 16px",
            backgroundColor: "#047DD4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px"
          }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      {/* Overall System Health */}
      <div style={{ 
        padding: "12px", 
        backgroundColor: healthSummary.overallHealth === 'good' ? '#d4edda' : 
                          healthSummary.overallHealth === 'warning' ? '#fff3cd' : '#f8d7da',
        borderRadius: "4px", 
        marginBottom: "20px",
        border: `1px solid ${healthSummary.overallHealth === 'good' ? '#c3e6cb' : 
                                healthSummary.overallHealth === 'warning' ? '#ffeaa7' : '#f5c6cb'}`,
        color: '#212529' // Dark text for better readability
      }}>
        <strong style={{ color: '#212529' }}>System Health: </strong>
        <span style={{ 
          color: healthSummary.overallHealth === 'good' ? '#155724' : 
                 healthSummary.overallHealth === 'warning' ? '#856404' : '#721c24',
          textTransform: 'uppercase',
          fontWeight: 'bold'
        }}>
          {healthSummary.overallHealth}
        </span>
        <br />
        <small style={{ color: '#495057' }}>
          Environment Variables: {healthSummary.envVarsConfigured}/{healthSummary.envVarsTotal} configured | 
          API Connections: {healthSummary.connectionsWorking}/{healthSummary.connectionsTotal} working
          <br />
          Last checked: {debugStatus.lastChecked.toLocaleTimeString()}
        </small>
      </div>

      {/* Environment Variables */}
      <h4>Environment Variables:</h4>
      <ul>
        <li>Supabase URL: {debugStatus.envVars.supabaseUrl ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Supabase Anon Key: {debugStatus.envVars.supabaseAnonKey ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Supabase Service Key: {debugStatus.envVars.supabaseServiceKey ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Google Maps Key: {debugStatus.envVars.googleMapsKey ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Google Client ID: {debugStatus.envVars.googleClientId ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Google Client Secret: {debugStatus.envVars.googleClientSecret ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>Spoonacular Key: {debugStatus.envVars.spoonacularKey ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>OpenAI Key: {debugStatus.envVars.openaiKey ? "✅ LOADED" : "❌ MISSING"}</li>
        <li>YouTube API Key: {debugStatus.envVars.youtubeApiKey ? "✅ LOADED" : "❌ MISSING"}</li>
      </ul>

      {/* API Connections */}
      <h4>API Connections:</h4>
      <ul>
        <li>Supabase: {debugStatus.connections.supabase ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.supabase && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.supabase}</li>}
        
        <li>Supabase Storage: {debugStatus.connections.supabaseStorage ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.supabaseStorage && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.supabaseStorage}</li>}
        
        <li>Google Maps: {debugStatus.connections.googleMaps ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.googleMaps && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.googleMaps}</li>}
        
        <li>Google Places: {debugStatus.connections.googlePlaces ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.googlePlaces && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.googlePlaces}</li>}
        
        <li>Spoonacular: {debugStatus.connections.spoonacular ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.spoonacular && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.spoonacular}</li>}
        
        <li>OpenAI: {debugStatus.connections.openai ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.openai && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.openai}</li>}
        
        <li>YouTube: {debugStatus.connections.youtube ? "✅ CONNECTED" : "❌ FAILED"}</li>
        {debugStatus.errors.youtube && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.youtube}</li>}
        
        <li>OAuth Config: {debugStatus.connections.oauth ? "✅ CONFIGURED" : "❌ FAILED"}</li>
        {debugStatus.errors.oauth && <li style={{ color: "red", marginLeft: "20px" }}>Error: {debugStatus.errors.oauth}</li>}
      </ul>

      {/* Page-specific features */}
      {pageSpecificFeatures && (
        <div style={{ marginTop: "30px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
          {pageSpecificFeatures}
        </div>
      )}
    </div>
  );
}