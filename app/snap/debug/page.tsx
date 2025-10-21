'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function SnapPageDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    const info = [];
    info.push('SnapPageDebug mounted successfully');
    info.push(`React version: ${React.version}`);
    info.push(`Current time: ${new Date().toISOString()}`);
    
    // Check if window and navigator are available
    if (typeof window !== 'undefined') {
      info.push('Window object available');
      if (navigator.mediaDevices) {
        info.push('MediaDevices API available');
      } else {
        info.push('MediaDevices API NOT available');
      }
      if (navigator.geolocation) {
        info.push('Geolocation API available');
      } else {
        info.push('Geolocation API NOT available');
      }
    } else {
      info.push('Window object NOT available (SSR)');
    }
    
    setDebugInfo(info);
  }, []);

  const testCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setDebugInfo(prev => [...prev, '✅ Camera access granted']);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setDebugInfo(prev => [...prev, `❌ Camera access denied: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const testLocationAccess = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDebugInfo(prev => [...prev, `✅ Location access granted: ${position.coords.latitude}, ${position.coords.longitude}`]);
        },
        (error) => {
          setDebugInfo(prev => [...prev, `❌ Location access denied: ${error.message}`]);
        }
      );
    } catch (error) {
      setDebugInfo(prev => [...prev, `❌ Location API error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const loadMainSnap = () => {
    // This will help us test if the main component loads
    window.location.href = '/snap-main';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Snap Debug Page</h1>
        
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="space-y-2 text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="p-2 bg-muted rounded">
                {info}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={testCameraAccess} className="w-full">
            Test Camera Access
          </Button>
          <Button onClick={testLocationAccess} className="w-full">
            Test Location Access
          </Button>
          <Button onClick={loadMainSnap} className="w-full bg-primary">
            Load Main Snap Component
          </Button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure you&apos;re accessing the site via HTTPS (required for camera/location)</li>
            <li>• Check browser console for additional error messages</li>
            <li>• Ensure camera and location permissions are enabled</li>
            <li>• Try refreshing the page if issues persist</li>
          </ul>
        </div>
      </div>
    </div>
  );
}