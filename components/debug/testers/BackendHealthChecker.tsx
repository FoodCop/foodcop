import React, { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HealthCheckResult {
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  url?: string;
}

export function BackendHealthChecker() {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult>({ status: 'loading' });

  const checkHealth = async () => {
    setHealthCheck({ status: 'loading' });
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`;
      console.log('🏥 Checking backend health at:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthCheck({ 
        status: 'success', 
        data, 
        url 
      });
      
    } catch (error) {
      setHealthCheck({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        url: `https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-[#0B1F3A]">Backend Health Check</h3>
        <button
          onClick={checkHealth}
          className="px-3 py-1 bg-[#F14C35] text-white rounded text-sm hover:bg-[#E03A28] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Status: </span>
          <span className={`px-2 py-1 rounded text-xs ${
            healthCheck.status === 'success' ? 'bg-green-100 text-green-800' :
            healthCheck.status === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {healthCheck.status}
          </span>
        </div>

        <div>
          <span className="font-medium">Project ID: </span>
          <span className="font-mono text-xs">{projectId}</span>
        </div>

        {healthCheck.url && (
          <div>
            <span className="font-medium">URL: </span>
            <div className="font-mono text-xs break-all bg-gray-50 p-2 rounded">
              {healthCheck.url}
            </div>
          </div>
        )}

        {healthCheck.status === 'error' && (
          <div>
            <span className="font-medium text-red-600">Error: </span>
            <div className="text-red-600 bg-red-50 p-2 rounded text-xs">
              {healthCheck.error}
            </div>
          </div>
        )}

        {healthCheck.status === 'success' && healthCheck.data && (
          <div>
            <span className="font-medium text-green-600">Response: </span>
            <pre className="text-xs bg-green-50 p-2 rounded overflow-auto">
              {JSON.stringify(healthCheck.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
