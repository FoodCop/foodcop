import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, RefreshCw, CheckCircle, XCircle, AlertTriangle, Link } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CallbackURLFixer } from './CallbackURLFixer';
import { OAuth403Troubleshooter } from './OAuth403Troubleshooter';

interface QuickDiagnosticsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickTest {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export function QuickDiagnosticsPopup({ isOpen, onClose }: QuickDiagnosticsPopupProps) {
  const [tests, setTests] = useState<QuickTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showCallbackFixer, setShowCallbackFixer] = useState(false);
  const [showOAuth403Troubleshooter, setShowOAuth403Troubleshooter] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('🔧 QuickDiagnosticsPopup: Opening popup');
      runQuickTests();
    }
  }, [isOpen]);

  const runQuickTests = async () => {
    console.log('🔧 QuickDiagnosticsPopup: Starting quick tests');
    setIsRunning(true);
    setTests([]);

    const newTests: QuickTest[] = [];

    // Test 1: Environment Variables
    newTests.push({
      name: 'Environment Setup',
      status: 'pending',
      message: 'Checking environment variables...'
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));

    if (projectId && publicAnonKey) {
      newTests[0] = {
        name: 'Environment Setup',
        status: 'pass',
        message: 'Supabase configuration found',
        details: `Project: ${projectId.substring(0, 8)}...`
      };
    } else {
      newTests[0] = {
        name: 'Environment Setup',
        status: 'fail',
        message: 'Missing Supabase configuration',
        details: 'Project ID or anon key not found'
      };
    }
    setTests([...newTests]);

    // Test 2: Backend Connection
    newTests.push({
      name: 'Backend Connection',
      status: 'pending',
      message: 'Testing backend connection...'
    });
    setTests([...newTests]);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        newTests[1] = {
          name: 'Backend Connection',
          status: 'pass',
          message: 'Backend is responding',
          details: `Status: ${data.status || 'healthy'}`
        };
      } else {
        newTests[1] = {
          name: 'Backend Connection',
          status: 'warning',
          message: `Backend responded with ${response.status}`,
          details: 'Server may be starting or experiencing issues'
        };
      }
    } catch (error) {
      newTests[1] = {
        name: 'Backend Connection',
        status: 'fail',
        message: 'Cannot reach backend',
        details: error instanceof Error ? error.message : 'Network error'
      };
    }
    setTests([...newTests]);

    // Test 3: Google Services
    newTests.push({
      name: 'Google Services',
      status: 'pending',
      message: 'Checking Google API integration...'
    });
    setTests([...newTests]);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5976446e/test-google-apis`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        newTests[2] = {
          name: 'Google Services',
          status: 'pass',
          message: 'Google APIs accessible',
          details: `Available: ${data.services?.join(', ') || 'multiple'}`
        };
      } else {
        newTests[2] = {
          name: 'Google Services',
          status: 'warning',
          message: 'Google API test inconclusive',
          details: 'Check individual service configurations'
        };
      }
    } catch (error) {
      newTests[2] = {
        name: 'Google Services',
        status: 'fail',
        message: 'Cannot test Google services',
        details: 'Backend connection required'
      };
    }
    setTests([...newTests]);

    setIsRunning(false);
    console.log('🔧 QuickDiagnosticsPopup: Tests completed');
  };

  const getStatusIcon = (status: QuickTest['status']) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: QuickTest['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 Quick Backend Diagnostics
            <Badge variant="outline">
              {tests.length > 0 && tests.every(t => t.status !== 'pending') ? 'Complete' : 'Running'}
            </Badge>
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🎯 What This Tests</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Supabase project configuration</li>
              <li>• Backend Edge Function availability</li>
              <li>• Google API service integration</li>
            </ul>
          </div>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <Card key={index} className={`border-2 ${getStatusColor(test.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                      {test.details && (
                        <p className="text-xs text-gray-500 mt-2 font-mono bg-white p-2 rounded">
                          {test.details}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Initializing diagnostics...</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={runQuickTests} 
              disabled={isRunning}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Run Again'}
            </Button>
            <Button 
              onClick={() => setShowCallbackFixer(true)}
              variant="outline"
              className="gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Link className="w-4 h-4" />
              Fix URLs
            </Button>
            <Button 
              onClick={() => setShowOAuth403Troubleshooter(true)}
              variant="outline"
              className="gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            >
              <AlertTriangle className="w-4 h-4" />
              Fix 403 Error
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">💡 Need More Details?</h4>
            <p className="text-gray-700 text-sm">
              For comprehensive diagnostics, use the full "🔧 Backend Diagnostics" screen from the demo menu.
            </p>
          </div>
        </div>

        {/* Callback URL Fixer Modal */}
        <CallbackURLFixer 
          isOpen={showCallbackFixer}
          onClose={() => setShowCallbackFixer(false)}
        />

        {/* OAuth 403 Troubleshooter Modal */}
        <OAuth403Troubleshooter 
          isOpen={showOAuth403Troubleshooter}
          onClose={() => setShowOAuth403Troubleshooter(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
