"use client";

import { useEffect, useState } from "react";

export function AIDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnections = async () => {
      const info: any = {};

      // Check environment variables
      info.envVars = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        openaiKey: !!process.env.OPENAI_API_KEY,
        openaiModel: !!process.env.OPENAI_MODEL,
        googleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
        spoonacularKey: !!process.env.SPOONACULAR_API_KEY,
        pineconeKey: !!process.env.PINECONE_API_KEY,
      };

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

      // Test OpenAI API
      try {
        const response = await fetch("/api/debug/openai");
        const data = await response.json();
        info.openaiConnection = data.success;
        info.openaiError = data.error;
        info.openaiModel = data.model;
      } catch (error) {
        info.openaiConnection = false;
        info.openaiError = error instanceof Error ? error.message : "Unknown error";
      }

      setDebugInfo(info);
      setLoading(false);
    };

    checkConnections();
  }, []);

  if (loading) {
    return <div>Loading debug information...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <h3>AI Page Debug Information</h3>
      
      <h4>Environment Variables:</h4>
      <ul>
        <li>Supabase URL: {debugInfo.envVars?.supabaseUrl ? "LOADED" : "MISSING"}</li>
        <li>Supabase Anon Key: {debugInfo.envVars?.supabaseAnonKey ? "LOADED" : "MISSING"}</li>
        <li>OpenAI Key: {debugInfo.envVars?.openaiKey ? "LOADED" : "MISSING"}</li>
        <li>OpenAI Model: {debugInfo.envVars?.openaiModel ? "LOADED" : "MISSING"}</li>
        <li>Google Maps Key: {debugInfo.envVars?.googleMapsKey ? "LOADED" : "MISSING"}</li>
        <li>Spoonacular Key: {debugInfo.envVars?.spoonacularKey ? "LOADED" : "MISSING"}</li>
        <li>Pinecone Key: {debugInfo.envVars?.pineconeKey ? "LOADED" : "MISSING"}</li>
      </ul>

      <h4>API Connections:</h4>
      <ul>
        <li>Supabase: {debugInfo.supabaseConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.supabaseError && <li>Supabase Error: {debugInfo.supabaseError}</li>}
        
        <li>OpenAI API: {debugInfo.openaiConnection ? "CONNECTED" : "FAILED"}</li>
        {debugInfo.openaiModel && <li>OpenAI Model: {debugInfo.openaiModel}</li>}
        {debugInfo.openaiError && <li>OpenAI Error: {debugInfo.openaiError}</li>}
      </ul>
    </div>
  );
}
