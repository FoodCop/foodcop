import React, { useState } from 'react';
import { AlertTriangle, Shield, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function SecurityGuidance() {
  const [showKeys, setShowKeys] = useState(false);

  const securityIssues = [
    {
      severity: 'resolved',
      api: 'OpenAI & Spoonacular',
      issue: 'Removed from client-side configuration',
      impact: 'Security risk eliminated',
      action: 'APIs removed - use backend proxies when needed'
    },
    {
      severity: 'medium',
      api: 'Google Places',
      issue: 'Key designed for client-side but needs restrictions',
      impact: 'Lower risk if domain restrictions are enabled',
      action: 'Enable domain restrictions in Google Console'
    }
  ];

  const safeApis = [
    {
      api: 'Google Maps/Places',
      why: 'Designed for client-side use with domain restrictions',
      howToSecure: 'Enable HTTP referrer restrictions in Google Cloud Console'
    },
    {
      api: 'Stream Chat API Key',
      why: 'Public key meant for client-side initialization',
      howToSecure: 'Keep API secret on server-side only'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Security Status Alert */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-green-800 mb-2">✅ Security Issues Resolved</h1>
              <p className="text-green-700 mb-4">
                Sensitive API keys have been removed from your client-side configuration. Your app now uses only 
                client-safe APIs with proper security measures.
              </p>
              <div className="bg-green-100 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">Current Secure Setup:</h3>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>OpenAI & Spoonacular APIs removed from client-side</li>
                  <li>Google Maps API configured for client-side use (needs domain restrictions)</li>
                  <li>Stream Chat API configured with public keys only</li>
                  <li>Mock functions available for removed APIs during development</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security Issues Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">Security Issues Found</h2>
          <div className="space-y-4">
            {securityIssues.map((issue, index) => (
              <div key={index} className={`border-2 rounded-xl p-4 ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5" />
                    <h3 className="font-bold">{issue.api} API</h3>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm mb-2"><strong>Issue:</strong> {issue.issue}</p>
                <p className="text-sm mb-2"><strong>Impact:</strong> {issue.impact}</p>
                <p className="text-sm"><strong>Action:</strong> {issue.action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Safe APIs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">APIs Safe for Client-Side Use</h2>
          <div className="space-y-4">
            {safeApis.map((api, index) => (
              <div key={index} className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                <div className="flex items-start space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800">{api.api}</h3>
                    <p className="text-sm text-green-700 mb-2">{api.why}</p>
                    <p className="text-sm text-green-600"><strong>How to secure:</strong> {api.howToSecure}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Fix Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">Quick Fix Steps</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-[#0B1F3A] mb-2">1. ✅ Sensitive APIs Removed</h3>
              <div className="space-y-2">
                <p className="text-green-700 text-sm">
                  OpenAI and Spoonacular APIs have been removed from client-side configuration.
                  When you need these features, implement them through secure backend proxies.
                </p>
              </div>
            </div>

            <div className="border-l-4 border-[#F14C35] pl-4">
              <h3 className="font-bold text-[#0B1F3A] mb-2">2. Secure Your Google API Key</h3>
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                 className="flex items-center space-x-2 text-[#F14C35] hover:underline">
                <Shield className="w-4 h-4" />
                <span>Add HTTP referrer restrictions</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="border-l-4 border-[#F14C35] pl-4">
              <h3 className="font-bold text-[#0B1F3A] mb-2">3. Configure Stream Chat Properly</h3>
              <p className="text-gray-700 text-sm mb-2">
                For Stream Chat, you only need the API Key and App ID on the client-side. 
                The API Secret should never be exposed.
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-mono">
                  ✅ Client-side: API Key + App ID<br/>
                  ❌ Client-side: API Secret (server-only)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Secure Configuration */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Current Secure Configuration</h2>
          
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 mb-1">✅ OpenAI API:</p>
              <p className="text-xs text-green-600">REMOVED - Use backend proxy when needed</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 mb-1">✅ Spoonacular API:</p>
              <p className="text-xs text-green-600">REMOVED - Use backend proxy when needed</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-1">🔒 Google API Key:</p>
              <p className="text-xs text-blue-600">Placeholder configured - add your key with domain restrictions</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-1">🔒 Stream Chat API:</p>
              <p className="text-xs text-blue-600">Placeholder configured - public keys only (no secrets)</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>✅ Security Status:</strong> Your configuration is now secure with only client-safe APIs enabled. 
              Add your Google API key with proper domain restrictions to enable location services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
