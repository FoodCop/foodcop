import React, { useState } from 'react';
import { AlertTriangle, CreditCard, ExternalLink, CheckCircle, AlertCircle, DollarSign, Shield } from 'lucide-react';

export function BillingSetupGuide() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: 'Enable Billing',
      icon: CreditCard,
      description: 'Set up billing on your Google Cloud Project'
    },
    {
      id: 1,
      title: 'Set Quotas',
      icon: Shield,
      description: 'Configure usage limits and alerts'
    },
    {
      id: 2,
      title: 'Test APIs',
      icon: CheckCircle,
      description: 'Verify your setup works correctly'
    }
  ];

  const costBreakdown = [
    { api: 'Maps JavaScript API', cost: '$7.00 per 1,000 map loads', freeQuota: '28,500 map loads per month' },
    { api: 'Places API (Find Place)', cost: '$17.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Places API (Nearby Search)', cost: '$32.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Places API (Text Search)', cost: '$32.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Places API (Place Details)', cost: '$17.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Geocoding API', cost: '$5.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Directions API', cost: '$5.00 per 1,000 requests', freeQuota: '0' },
    { api: 'Distance Matrix API', cost: '$5.00 per 1,000 requests', freeQuota: '0' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">Google Maps Billing Required</h1>
          <p className="text-gray-600">Enable billing to use Google Maps and Places APIs</p>
        </div>

        {/* Error Alert */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 mb-2">BillingNotEnabledMapError</h3>
              <p className="text-red-700 mb-4">
                Google requires billing to be enabled for Maps and Places APIs, even if you stay within free usage limits.
              </p>
              <div className="bg-red-100 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">What this means:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your Google Cloud Project doesn't have billing enabled</li>
                  <li>• APIs cannot be used without a valid payment method on file</li>
                  <li>• You may still qualify for free tier usage after enabling billing</li>
                  <li>• Google provides $200 in free credits for new accounts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8 py-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 transition-colors ${
                      activeStep === step.id
                        ? 'border-[#F14C35] text-[#F14C35]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{step.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {/* Step 0: Enable Billing */}
            {activeStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Enable Billing on Google Cloud</h2>
                  <p className="text-gray-600 mb-6">
                    Google requires a valid payment method for all Maps and Places API usage, even within free limits.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-blue-800 mb-2">New Google Cloud Users</h3>
                      <p className="text-blue-700 text-sm">
                        Google provides $200 in free credits for new accounts, which should cover development and testing needs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Step-by-Step Instructions:</h3>
                  <ol className="space-y-4 text-gray-700">
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-[#F14C35] mt-0.5">1.</span>
                      <div>
                        <span className="font-medium">Go to Google Cloud Console</span>
                        <div className="mt-2">
                          <a
                            href="https://console.cloud.google.com/billing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-[#F14C35] text-white px-4 py-2 rounded-lg hover:bg-[#d63e2a] transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open Billing Console</span>
                          </a>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-[#F14C35] mt-0.5">2.</span>
                      <span>Select your project or create a new billing account</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-[#F14C35] mt-0.5">3.</span>
                      <span>Add a valid payment method (credit card or bank account)</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-[#F14C35] mt-0.5">4.</span>
                      <span>Link the billing account to your Google Cloud project</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-[#F14C35] mt-0.5">5.</span>
                      <span>Wait 5-10 minutes for billing to propagate</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-yellow-800 mb-2">Alternative: Use Google's $200 Credit</h4>
                      <p className="text-sm text-yellow-700">
                        If you're new to Google Cloud, you can get $200 in free credits by signing up. 
                        This covers significant API usage for development and testing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Set Quotas */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Set Usage Limits & Alerts</h2>
                  <p className="text-gray-600 mb-6">
                    Protect yourself from unexpected charges by setting quotas and billing alerts.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-gray-800 mb-4">Recommended Quotas for Development:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium">Maps JavaScript API</span>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">1,000 requests/day</code>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium">Places API (All)</span>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">100 requests/day</code>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium">Geocoding API</span>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">100 requests/day</code>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">Directions API</span>
                      <code className="text-sm bg-gray-200 px-2 py-1 rounded">50 requests/day</code>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-blue-800 mb-4">How to Set Quotas:</h3>
                  <ol className="space-y-2 text-blue-700 text-sm">
                    <li>1. Go to Google Cloud Console → APIs & Services → Quotas</li>
                    <li>2. Filter by the APIs you want to limit</li>
                    <li>3. Click on each quota and set your daily limits</li>
                    <li>4. Set billing alerts in the Billing section</li>
                    <li>5. Recommended: Set alerts at $5, $10, and $25</li>
                  </ol>
                  
                  <a
                    href="https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm mt-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Set API Quotas</span>
                  </a>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="font-bold text-green-800 mb-4">Estimated Monthly Costs for FUZO Development:</h3>
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="text-left py-2 text-green-800">API</th>
                          <th className="text-right py-2 text-green-800">Est. Usage</th>
                          <th className="text-right py-2 text-green-800">Monthly Cost</th>
                        </tr>
                      </thead>
                      <tbody className="text-green-700">
                        <tr className="border-b border-green-200">
                          <td className="py-2">Maps JavaScript API</td>
                          <td className="text-right">~500 loads</td>
                          <td className="text-right font-medium">Free</td>
                        </tr>
                        <tr className="border-b border-green-200">
                          <td className="py-2">Places API (Search)</td>
                          <td className="text-right">~100 requests</td>
                          <td className="text-right font-medium">~$3.20</td>
                        </tr>
                        <tr className="border-b border-green-200">
                          <td className="py-2">Places API (Details)</td>
                          <td className="text-right">~50 requests</td>
                          <td className="text-right font-medium">~$0.85</td>
                        </tr>
                        <tr className="font-bold">
                          <td className="py-2">Total</td>
                          <td className="text-right"></td>
                          <td className="text-right">~$4.05/month</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Test APIs */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B1F3A] mb-4">Test Your API Setup</h2>
                  <p className="text-gray-600 mb-6">
                    Verify that billing is working and your APIs are accessible.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">Testing Checklist:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Billing account is active and linked</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">All required APIs are enabled</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">API key has proper restrictions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Usage quotas and alerts are set</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-blue-800 mb-3">Test in FUZO App:</h3>
                  <ol className="space-y-2 text-blue-700 text-sm">
                    <li>1. Refresh your browser and restart the dev server</li>
                    <li>2. Navigate to the Scout page and try location search</li>
                    <li>3. Visit the Google Maps Demo page</li>
                    <li>4. Check the browser console for any remaining errors</li>
                    <li>5. Monitor your Google Cloud Console for API usage</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-800 mb-2">Success!</h4>
                      <p className="text-sm text-green-700">
                        If you can see maps loading and restaurant data appearing, your billing and API setup is complete! 
                        Remember to monitor your usage and costs in the Google Cloud Console.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-[#0B1F3A] mb-6">Google Maps API Pricing</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-800">API</th>
                  <th className="text-right py-3 text-gray-800">Cost per 1,000 requests</th>
                  <th className="text-right py-3 text-gray-800">Free Tier</th>
                </tr>
              </thead>
              <tbody>
                {costBreakdown.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-700">{item.api}</td>
                    <td className="text-right py-3 text-gray-700">{item.cost}</td>
                    <td className="text-right py-3 text-gray-700 font-medium">{item.freeQuota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-sm text-gray-600">
            <p><strong>Note:</strong> Prices shown are current as of 2024. Check Google Cloud Pricing for the most up-to-date information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
