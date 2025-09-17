import React, { useState } from 'react';
import { Send, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  details?: any;
}

export function TakoAITester() {
  const [testInput, setTestInput] = useState('Hello Tako! Can you help me find a good restaurant?');
  const [healthResult, setHealthResult] = useState<TestResult>({ status: 'idle', message: '' });
  const [chatResult, setChatResult] = useState<TestResult>({ status: 'idle', message: '' });

  const testHealthEndpoint = async () => {
    setHealthResult({ status: 'testing', message: 'Testing health endpoint...' });
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthResult({ 
        status: 'success', 
        message: 'Health check passed!',
        details: data
      });
    } catch (error) {
      setHealthResult({ 
        status: 'error', 
        message: `Health check failed: ${error.message}`,
        details: error
      });
    }
  };

  const testChatEndpoint = async () => {
    setChatResult({ status: 'testing', message: 'Testing Tako AI chat...' });
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/tako-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          message: testInput,
          conversation: []
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setChatResult({ 
        status: 'success', 
        message: 'Chat test successful!',
        details: data
      });
    } catch (error) {
      setChatResult({ 
        status: 'error', 
        message: `Chat test failed: ${error.message}`,
        details: error
      });
    }
  };

  const StatusIcon = ({ status }: { status: TestResult['status'] }) => {
    switch (status) {
      case 'testing':
        return <div className="w-5 h-5 border-2 border-[#F14C35] border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0B1F3A] mb-2">🐙 Tako AI Tester</h1>
          <p className="text-gray-600">Test OpenAI integration and backend connectivity</p>
        </div>

        {/* Configuration Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-[#0B1F3A] mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Supabase Project ID:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1">{projectId}</div>
            </div>
            <div>
              <strong>Backend URL:</strong>
              <div className="font-mono bg-gray-100 p-2 rounded mt-1 text-xs break-all">
                https://{projectId}.supabase.co/functions/v1/make-server-5976446e/
              </div>
            </div>
          </div>
        </div>

        {/* Health Check Test */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">Health Check Test</h2>
            <button
              onClick={testHealthEndpoint}
              disabled={healthResult.status === 'testing'}
              className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <TestTube className="w-4 h-4" />
              <span>Test Health</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <StatusIcon status={healthResult.status} />
            <span className="font-medium">{healthResult.message}</span>
          </div>
          
          {healthResult.details && (
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <pre className="text-xs overflow-x-auto">{JSON.stringify(healthResult.details, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Chat Test */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">Tako AI Chat Test</h2>
            <button
              onClick={testChatEndpoint}
              disabled={chatResult.status === 'testing'}
              className="px-4 py-2 bg-[#F14C35] text-white rounded-lg hover:bg-[#E63E26] transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Test Chat</span>
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Message:</label>
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 focus:border-[#F14C35]"
              placeholder="Enter a message to test..."
            />
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            <StatusIcon status={chatResult.status} />
            <span className="font-medium">{chatResult.message}</span>
          </div>
          
          {chatResult.details && (
            <div className="bg-gray-50 p-3 rounded-lg mt-3">
              <div className="text-sm font-medium mb-2">AI Response:</div>
              {chatResult.status === 'success' ? (
                <div>
                  <div className="mb-2 p-3 bg-white rounded border">
                    <strong>Message:</strong> {chatResult.details.message}
                  </div>
                  {chatResult.details.cards && chatResult.details.cards.length > 0 && (
                    <div className="mb-2 p-3 bg-white rounded border">
                      <strong>Cards:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(chatResult.details.cards, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="text-xs overflow-x-auto text-red-600">{JSON.stringify(chatResult.details, null, 2)}</pre>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🔧 Troubleshooting</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>If health check fails:</strong> Check if the Supabase Edge Function is deployed and running.</p>
            <p><strong>If chat test fails:</strong> Verify the OPENAI_API_KEY environment variable is set in your Supabase project.</p>
            <p><strong>CORS errors:</strong> Ensure the Edge Function has proper CORS headers configured.</p>
            <p><strong>Authorization errors:</strong> Check that the anon key is correct and has proper permissions.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-[#0B1F3A] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                testHealthEndpoint();
                setTimeout(testChatEndpoint, 1000);
              }}
              className="p-4 border-2 border-[#F14C35] text-[#F14C35] rounded-lg hover:bg-[#F14C35]/5 transition-colors"
            >
              <div className="font-semibold mb-1">Run All Tests</div>
              <div className="text-sm">Test both health and chat endpoints</div>
            </button>
            
            <button
              onClick={() => {
                setHealthResult({ status: 'idle', message: '' });
                setChatResult({ status: 'idle', message: '' });
              }}
              className="p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-semibold mb-1">Clear Results</div>
              <div className="text-sm">Reset all test results</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
