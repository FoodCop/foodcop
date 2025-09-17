import React, { useState } from 'react';
import { Settings, Key, Shield, ExternalLink, Copy, Check, AlertCircle, FileText } from 'lucide-react';

export function EnvironmentSetup() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(`VITE_GOOGLE_MAPS_API_KEY=${apiKey}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'google-maps', label: 'Google Maps', icon: Key },
    { id: 'stream-chat', label: 'Stream Chat', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const envVariables = [
    { name: 'VITE_GOOGLE_MAPS_API_KEY', required: true, description: 'Google Maps and Places API access' },
    { name: 'VITE_STREAM_CHAT_API_KEY', required: true, description: 'Real-time chat functionality' },
    { name: 'VITE_STREAM_CHAT_USER_TOKEN', required: true, description: 'Chat user authentication' },
    { name: 'VITE_UNSPLASH_ACCESS_KEY', required: false, description: 'High-quality food images' },
    { name: 'VITE_DEFAULT_LATITUDE', required: false, description: 'Default map center latitude' },
    { name: 'VITE_DEFAULT_LONGITUDE', required: false, description: 'Default map center longitude' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F14C35] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">FUZO Environment Setup</h1>
          <p className="text-gray-600">Configure your API keys and environment variables</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 py-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#F14C35] text-[#F14C35]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Environment Variables Overview</h2>
                  <p className="text-gray-600 mb-6">
                    FUZO requires several environment variables to be configured. Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env</code> and configure the following:
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Required Variables</h3>
                  <div className="space-y-3">
                    {envVariables.filter(v => v.required).map((variable, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#F14C35] rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <code className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{variable.name}</code>
                          <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-blue-800 mb-4">Optional Variables</h3>
                  <div className="space-y-3">
                    {envVariables.filter(v => !v.required).map((variable, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <code className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">{variable.name}</code>
                          <p className="text-sm text-blue-700 mt-1">{variable.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-2">Important Notes</h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        <li>• All client-side variables must start with <code className="bg-yellow-100 px-1 rounded">VITE_</code></li>
                        <li>• Restart your development server after changing .env</li>
                        <li>• Never commit .env files with real API keys</li>
                        <li>• Always add domain restrictions to production API keys</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Maps Tab */}
            {activeTab === 'google-maps' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Google Maps API Setup</h2>
                  <p className="text-gray-600 mb-6">
                    Configure Google Maps API for location services, restaurant discovery, and mapping features.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Step 1: Create API Key</h3>
                  <ol className="space-y-2 text-gray-700">
                    <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#F14C35] hover:underline">Google Cloud Console</a></li>
                    <li>2. Create a new project or select existing one</li>
                    <li>3. Enable these APIs: Maps JavaScript API, Places API, Geocoding API, Distance Matrix API, Directions API</li>
                    <li>4. Go to Credentials → Create Credentials → API Key</li>
                  </ol>
                  
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-[#F14C35] text-white px-4 py-2 rounded-lg hover:bg-[#d63e2a] transition-colors mt-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Google Cloud Console</span>
                  </a>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800">Step 2: Add to Environment</h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your Google API key here..."
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
                  
                  {apiKey && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">
                        ✅ Add this line to your <code className="bg-green-100 px-1 rounded">.env</code> file:
                      </p>
                      <code className="block mt-2 text-sm bg-green-100 px-3 py-2 rounded font-mono">
                        VITE_GOOGLE_MAPS_API_KEY={apiKey}
                      </code>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-bold text-yellow-800 mb-3">⚠️ Security: Add API Restrictions</h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    Always add HTTP referrer restrictions to protect your API quota:
                  </p>
                  <div className="space-y-1">
                    {['https://yourdomain.com/*', 'https://yourdomain.vercel.app/*', 'http://localhost:3000/*'].map((example, index) => (
                      <code key={index} className="block text-xs text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                        {example}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stream Chat Tab */}
            {activeTab === 'stream-chat' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Stream Chat API Setup</h2>
                  <p className="text-gray-600 mb-6">
                    Configure Stream Chat for real-time messaging features in FUZO.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Step 1: Create Stream Account</h3>
                  <ol className="space-y-2 text-gray-700">
                    <li>1. Go to <a href="https://getstream.io/chat/" target="_blank" rel="noopener noreferrer" className="text-[#F14C35] hover:underline">GetStream.io</a></li>
                    <li>2. Create a free account</li>
                    <li>3. Create a new Chat application</li>
                    <li>4. Copy your API Key from the dashboard</li>
                    <li>5. Generate a user token for testing</li>
                  </ol>
                  
                  <a
                    href="https://getstream.io/chat/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-[#F14C35] text-white px-4 py-2 rounded-lg hover:bg-[#d63e2a] transition-colors mt-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Stream Chat</span>
                  </a>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-blue-800 mb-3">Step 2: Add to .env file</h3>
                  <div className="space-y-2">
                    <code className="block text-sm bg-blue-100 px-3 py-2 rounded font-mono">
                      VITE_STREAM_CHAT_API_KEY=your_stream_api_key_here
                    </code>
                    <code className="block text-sm bg-blue-100 px-3 py-2 rounded font-mono">
                      VITE_STREAM_CHAT_USER_TOKEN=your_user_token_here
                    </code>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="font-bold text-green-800 mb-2">💡 Development Tip</h4>
                  <p className="text-sm text-green-700">
                    Stream Chat API key is safe for client-side use. However, user tokens should be generated server-side in production for security.
                  </p>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Security Best Practices</h2>
                  <p className="text-gray-600 mb-6">
                    Follow these security guidelines to protect your API keys and user data.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="font-bold text-green-800 mb-4">✅ Best Practices</h3>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>• Use VITE_ prefix for client variables</li>
                      <li>• Add HTTP referrer restrictions</li>
                      <li>• Monitor API usage regularly</li>
                      <li>• Set up billing alerts</li>
                      <li>• Use different keys for dev/prod</li>
                      <li>• Rotate keys periodically</li>
                      <li>• Keep .env in .gitignore</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="font-bold text-red-800 mb-4">❌ Security Risks</h3>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li>• Sharing keys publicly</li>
                      <li>• Using keys without restrictions</li>
                      <li>• Committing keys to version control</li>
                      <li>• Using same key everywhere</li>
                      <li>• Ignoring usage spikes</li>
                      <li>• No billing limits</li>
                      <li>• Exposing sensitive data</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-bold text-yellow-800 mb-3">🔒 API Key Restrictions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Google Maps API:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Add HTTP referrer restrictions</li>
                        <li>• Restrict to specific APIs only</li>
                        <li>• Set usage quotas</li>
                        <li>• Enable billing alerts</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Stream Chat API:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• API key is safe for client use</li>
                        <li>• Generate tokens server-side in production</li>
                        <li>• Implement proper user authentication</li>
                        <li>• Monitor chat usage and costs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">Quick Start</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
              <h3 className="font-bold text-gray-800 mb-2">Copy Environment File</h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">cp .env.example .env</code>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
              <h3 className="font-bold text-gray-800 mb-2">Configure API Keys</h3>
              <p className="text-sm text-gray-600">Add your Google Maps and Stream Chat keys</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-[#F14C35] text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
              <h3 className="font-bold text-gray-800 mb-2">Start Development</h3>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">npm run dev</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
