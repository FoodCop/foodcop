import React, { useState } from 'react';
import { MapPin, Shield, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';

export function GoogleMapsSetup() {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const restrictionExamples = [
    'https://yourapp.com/*',
    'https://yourapp.vercel.app/*',
    'http://localhost:3000/*',
    'https://*.yourapp.com/*'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">Google Maps API Setup</h1>
            <p className="text-gray-600">Configure your Google Maps API for FUZO's location services</p>
          </div>

          {/* Step 1: Create API Key */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-bold text-[#0B1F3A]">Create Google API Key</h2>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-4">
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="font-medium text-[#F14C35] mt-1">1.</span>
                  <span>Go to Google Cloud Console</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-medium text-[#F14C35] mt-1">2.</span>
                  <span>Create a new project or select an existing one</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-medium text-[#F14C35] mt-1">3.</span>
                  <span>Enable these APIs: Places API, Maps JavaScript API, Geocoding API</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-medium text-[#F14C35] mt-1">4.</span>
                  <span>Go to Credentials → Create Credentials → API Key</span>
                </li>
              </ol>
            </div>

            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-[#F14C35] text-white px-4 py-2 rounded-lg hover:bg-[#d63e2a] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Google Cloud Console</span>
            </a>
          </div>

          {/* Step 2: Configure API Key */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-bold text-[#0B1F3A]">Enter Your API Key</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Maps API Key
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                  />
                  <button
                    onClick={handleCopyKey}
                    disabled={!apiKey}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {apiKey && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Next: Add this key to your configuration</p>
                      <p className="text-sm text-blue-700">
                        Copy this key and paste it into your <code className="bg-blue-100 px-1 rounded">apiConfig.ts</code> file, 
                        replacing <code className="bg-blue-100 px-1 rounded">YOUR_GOOGLE_API_KEY_HERE</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Secure with Restrictions */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h2 className="text-xl font-bold text-[#0B1F3A]">Add Security Restrictions</h2>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Security Step</h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    Without restrictions, anyone can use your API key. Add HTTP referrer restrictions to protect your quota and billing.
                  </p>
                  
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Add these HTTP referrer restrictions:</p>
                    <div className="space-y-1">
                      {restrictionExamples.map((example, index) => (
                        <code key={index} className="block text-xs text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                          {example}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-bold text-gray-800 mb-3">How to add restrictions:</h4>
              <ol className="space-y-2 text-gray-700 text-sm">
                <li>1. In Google Cloud Console, click on your API key</li>
                <li>2. Under "API restrictions", select "Restrict key"</li>
                <li>3. Choose: Maps JavaScript API, Places API, Geocoding API</li>
                <li>4. Under "Website restrictions", select "HTTP referrers"</li>
                <li>5. Add your website URLs (see examples above)</li>
                <li>6. Save changes</li>
              </ol>
            </div>
          </div>

          {/* Step 4: Test Configuration */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center font-bold">4</div>
              <h2 className="text-xl font-bold text-[#0B1F3A]">Test Your Setup</h2>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700 mb-4">
                After configuring your API key, test it by:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full"></div>
                  <span>Using the location features in FUZO Scout page</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full"></div>
                  <span>Searching for restaurants in the Feed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#F14C35] rounded-full"></div>
                  <span>Viewing the map in Group Dining events</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">Security Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-green-800">✅ Do</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Use HTTP referrer restrictions</li>
                <li>• Monitor API usage regularly</li>
                <li>• Set up billing alerts</li>
                <li>• Use specific API restrictions</li>
                <li>• Rotate keys periodically</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-red-800">❌ Don't</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Share keys publicly</li>
                <li>• Use keys without restrictions</li>
                <li>• Commit keys to version control</li>
                <li>• Use the same key for everything</li>
                <li>• Ignore usage spikes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
