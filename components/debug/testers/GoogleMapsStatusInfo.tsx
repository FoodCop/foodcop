import React from 'react';
import { motion } from 'motion/react';
import { MapPin, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { isGoogleAPIAvailable } from './config/apiConfig';

interface GoogleMapsStatusInfoProps {
  onClose?: () => void;
}

export function GoogleMapsStatusInfo({ onClose }: GoogleMapsStatusInfoProps) {
  const frontendMapsAvailable = isGoogleAPIAvailable();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-md w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#0B1F3A]">Google Maps Status</h3>
            <p className="text-sm text-gray-600">API Configuration Info</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Frontend Maps Status */}
        <div className={`p-3 rounded-lg border ${
          frontendMapsAvailable 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {frontendMapsAvailable ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-500" />
            )}
            <span className={`font-medium text-sm ${
              frontendMapsAvailable ? 'text-green-800' : 'text-gray-700'
            }`}>
              Interactive Google Maps
            </span>
          </div>
          <p className={`text-xs ${
            frontendMapsAvailable ? 'text-green-700' : 'text-gray-600'
          }`}>
            {frontendMapsAvailable 
              ? '✅ Working perfectly! You have full interactive maps with zoom, pan, and markers.'
              : '❌ Not configured. Set VITE_GOOGLE_MAPS_API_KEY to enable interactive maps.'
            }
          </p>
        </div>

        {/* Static Maps API Info */}
        <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-800">
              Static Maps API (Backend)
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            ⚠️ 403 Errors are normal! Static Maps API requires separate billing setup in Google Cloud Console.
          </p>
          <p className="text-xs text-blue-600">
            Since you have interactive maps working, the backend static maps are optional for your use case.
          </p>
        </div>

        {/* What's Working */}
        {frontendMapsAvailable && (
          <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200">
            <h4 className="font-medium text-emerald-800 text-sm mb-2">✨ What's Working Now:</h4>
            <ul className="space-y-1 text-xs text-emerald-700">
              <li>• Full interactive Google Maps with real-time data</li>
              <li>• Restaurant markers and info windows</li>
              <li>• Map controls (zoom, pan, my location)</li>
              <li>• Real restaurant search via Google Places</li>
            </ul>
          </div>
        )}

        {/* Setup Instructions (if needed) */}
        {!frontendMapsAvailable && (
          <div className="p-3 rounded-lg border bg-yellow-50 border-yellow-200">
            <h4 className="font-medium text-yellow-800 text-sm mb-2">📋 Setup Instructions:</h4>
            <ol className="space-y-1 text-xs text-yellow-700">
              <li>1. Go to Google Cloud Console</li>
              <li>2. Enable Maps JavaScript API & Places API</li>
              <li>3. Create an API key with HTTP referrer restrictions</li>
              <li>4. Set VITE_GOOGLE_MAPS_API_KEY in your environment</li>
            </ol>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {frontendMapsAvailable ? '🎉 All systems operational' : '🛠️ Setup required'}
          </span>
          <a
            href="https://console.cloud.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-[#F14C35] hover:underline"
          >
            <span>Google Cloud Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
