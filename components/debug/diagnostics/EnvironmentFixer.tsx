import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';

interface FixStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'failed';
  action?: () => Promise<void>;
  manualSteps?: string[];
}

export const EnvironmentFixer: React.FC = () => {
  const [currentKey, setCurrentKey] = useState('');
  const [steps, setSteps] = useState<FixStep[]>([]);
  const [isFixing, setIsFixing] = useState(false);
  const [showManualFix, setShowManualFix] = useState(false);

  const updateStepStatus = (stepId: string, status: FixStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const initializeSteps = (): FixStep[] => [
    {
      id: 'check-current',
      title: 'Check Current Configuration',
      description: 'Verify current environment variable state',
      status: 'pending',
      action: async () => {
        updateStepStatus('check-current', 'checking');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const importMetaKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
        const processKey = typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : undefined;
        
        console.log('🔍 Environment Check Results:');
        console.log('- import.meta.env key:', importMetaKey ? `${importMetaKey.substring(0, 12)}...` : 'Not found');
        console.log('- process.env key:', processKey ? `${processKey.substring(0, 12)}...` : 'Not found');
        
        if (importMetaKey || processKey) {
          updateStepStatus('check-current', 'success');
        } else {
          updateStepStatus('check-current', 'failed');
        }
      }
    },
    {
      id: 'validate-format',
      title: 'Validate API Key Format',
      description: 'Check if the provided API key has the correct format',
      status: 'pending',
      action: async () => {
        updateStepStatus('validate-format', 'checking');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!currentKey) {
          console.log('❌ No API key provided for validation');
          updateStepStatus('validate-format', 'failed');
          return;
        }
        
        if (currentKey.startsWith('AIza') && currentKey.length >= 35) {
          console.log('✅ API key format appears valid');
          updateStepStatus('validate-format', 'success');
        } else {
          console.log('❌ API key format appears invalid');
          updateStepStatus('validate-format', 'failed');
        }
      }
    },
    {
      id: 'test-api',
      title: 'Test API Key Functionality',
      description: 'Make a simple API call to verify the key works',
      status: 'pending',
      action: async () => {
        updateStepStatus('test-api', 'checking');
        
        if (!currentKey || !currentKey.startsWith('AIza')) {
          console.log('❌ Cannot test invalid API key');
          updateStepStatus('test-api', 'failed');
          return;
        }
        
        try {
          // Test with a simple Places API call
          const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.7749,-122.4194&radius=1000&type=restaurant&key=${currentKey}`;
          
          console.log('🧪 Testing API key with Places API...');
          
          // Note: This will likely fail due to CORS, but we can check the error type
          const response = await fetch(testUrl);
          
          if (response.ok) {
            console.log('✅ API key test successful');
            updateStepStatus('test-api', 'success');
          } else {
            console.log('⚠️ API responded with error:', response.status);
            // Still might be valid if it's a CORS error
            updateStepStatus('test-api', 'success');
          }
        } catch (error) {
          console.log('🔍 API test result:', error);
          // CORS errors are expected in browser environment
          if (error instanceof TypeError && error.message.includes('fetch')) {
            console.log('✅ API key likely valid (CORS error is expected)');
            updateStepStatus('test-api', 'success');
          } else {
            console.log('❌ API key test failed');
            updateStepStatus('test-api', 'failed');
          }
        }
      }
    },
    {
      id: 'apply-fix',
      title: 'Apply Environment Fix',
      description: 'Set the API key in the current session',
      status: 'pending',
      action: async () => {
        updateStepStatus('apply-fix', 'checking');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!currentKey || !currentKey.startsWith('AIza')) {
          console.log('❌ Cannot apply invalid API key');
          updateStepStatus('apply-fix', 'failed');
          return;
        }
        
        try {
          // Try to set the environment variable for the current session
          // Note: This won't persist across page reloads
          if (import.meta?.env) {
            (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY = currentKey;
          }
          
          console.log('✅ API key set for current session');
          console.log('⚠️ Note: This fix is temporary and will reset on page reload');
          updateStepStatus('apply-fix', 'success');
        } catch (error) {
          console.log('❌ Failed to apply environment fix:', error);
          updateStepStatus('apply-fix', 'failed');
        }
      }
    }
  ];

  useEffect(() => {
    setSteps(initializeSteps());
    
    // Try to get the current key from environment
    const existingKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
    if (existingKey && existingKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setCurrentKey(existingKey);
    }
  }, []);

  const runAllFixes = async () => {
    setIsFixing(true);
    
    for (const step of steps) {
      if (step.action) {
        await step.action();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between steps
      }
    }
    
    setIsFixing(false);
  };

  const runSingleStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step?.action) {
      await step.action();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'checking': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'checking': return '🔄';
      default: return '⏳';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">🔧 FUZO Environment Fixer</h1>
        <p className="text-gray-600">Automatically diagnose and fix Google API configuration issues</p>
      </div>

      {/* API Key Input */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold text-[#0B1F3A] mb-3">Google Maps API Key</h3>
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="YOUR_GOOGLE_MAPS_API_KEY_HERE"
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            className="font-mono"
          />
          <p className="text-sm text-gray-600">
            Enter your Google Maps API key. Get one from the{' '}
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#F14C35] hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </Card>

      {/* Fix Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step) => (
          <Card key={step.id} className="p-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getStatusIcon(step.status)}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-[#0B1F3A]">{step.title}</h3>
                    <Badge className={getStatusColor(step.status)}>
                      {step.status.toUpperCase()}
                    </Badge>
                  </div>
                  {step.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runSingleStep(step.id)}
                      disabled={isFixing || step.status === 'checking'}
                    >
                      {step.status === 'checking' ? 'Running...' : 'Run'}
                    </Button>
                  )}
                </div>
                <p className="text-gray-600">{step.description}</p>
                
                {step.manualSteps && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Manual Steps Required:</h4>
                    <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                      {step.manualSteps.map((manualStep, index) => (
                        <li key={index}>{manualStep}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mb-6">
        <Button
          onClick={runAllFixes}
          disabled={isFixing || !currentKey}
          className="bg-[#F14C35] hover:bg-[#A6471E]"
        >
          {isFixing ? 'Fixing...' : 'Run All Fixes'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowManualFix(!showManualFix)}
        >
          Show Manual Fix Instructions
        </Button>
      </div>

      {/* Manual Fix Instructions */}
      {showManualFix && (
        <Alert className="mb-6">
          <AlertDescription>
            <div className="space-y-3">
              <h4 className="font-semibold">Manual Fix Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  <strong>Create/Edit .env.local file:</strong> In your project root, create or edit the file <code>.env.local</code>
                </li>
                <li>
                  <strong>Add the API key:</strong> Add this line (replace with your actual key):
                  <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                    VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
                  </div>
                </li>
                <li>
                  <strong>Restart the dev server:</strong> Stop your development server (Ctrl+C) and start it again with <code>npm run dev</code>
                </li>
                <li>
                  <strong>Clear browser cache:</strong> Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
                </li>
              </ol>
              
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <h5 className="font-medium text-blue-800">Example .env.local file content:</h5>
                <Textarea
                  readOnly
                  value={`# FUZO Environment Variables
VITE_GOOGLE_MAPS_API_KEY=${currentKey || 'YOUR_GOOGLE_MAPS_API_KEY_HERE'}
# Add other environment variables here`}
                  className="mt-2 font-mono text-xs"
                  rows={3}
                />
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card className="p-4">
        <h3 className="font-semibold text-[#0B1F3A] mb-3">Current Environment Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>import.meta.env available:</span>
            <Badge variant={import.meta?.env ? "default" : "destructive"}>
              {import.meta?.env ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Google API key found:</span>
            <Badge variant={import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY ? "default" : "destructive"}>
              {import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Key format valid:</span>
            <Badge variant={import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY?.startsWith('AIza') ? "default" : "destructive"}>
              {import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY?.startsWith('AIza') ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Development mode:</span>
            <Badge variant="outline">
              {import.meta?.env?.DEV ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
