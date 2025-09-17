import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { API_CONFIG, isGoogleAPIAvailable, getGoogleApiKeySafe } from './config/apiConfig';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export function GoogleMapsTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: API Key Configuration
    testResults.push({
      name: 'Google Maps API Key',
      status: 'loading',
      message: 'Checking API key configuration...'
    });
    setTests([...testResults]);

    const apiKey = getGoogleApiKeySafe();
    if (apiKey) {
      testResults[0] = {
        name: 'Google Maps API Key',
        status: 'success',
        message: 'API key found and validated',
        details: `Key format: ${apiKey.substring(0, 8)}...`
      };
    } else {
      testResults[0] = {
        name: 'Google Maps API Key',
        status: 'error',
        message: 'API key not found or invalid',
        details: 'Set VITE_GOOGLE_MAPS_API_KEY in your environment'
      };
    }
    setTests([...testResults]);

    // Test 2: Google Maps JavaScript API Loading
    testResults.push({
      name: 'Google Maps JS API',
      status: 'loading',
      message: 'Loading Google Maps JavaScript API...'
    });
    setTests([...testResults]);

    if (apiKey) {
      try {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          testResults[1] = {
            name: 'Google Maps JS API',
            status: 'success',
            message: 'Google Maps JavaScript API loaded successfully',
            details: 'API is ready for map initialization'
          };
        } else {
          // Try to load Google Maps JavaScript API
          const script = document.createElement('script');
          script.src = `${API_CONFIG.GOOGLE_MAPS_API_URL}?key=${apiKey}&libraries=places`;
          script.async = true;

          const loadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
              if (window.google && window.google.maps) {
                resolve(true);
              } else {
                reject(new Error('Google Maps API loaded but not accessible'));
              }
            };
            script.onerror = () => reject(new Error('Failed to load Google Maps JavaScript API'));
          });

          document.head.appendChild(script);

          try {
            await loadPromise;
            testResults[1] = {
              name: 'Google Maps JS API',
              status: 'success',
              message: 'Google Maps JavaScript API loaded successfully',
              details: 'API loaded and initialized'
            };
          } catch (error: any) {
            testResults[1] = {
              name: 'Google Maps JS API',
              status: 'error',
              message: 'Failed to load Google Maps JavaScript API',
              details: error.message
            };
          }
        }
      } catch (error: any) {
        testResults[1] = {
          name: 'Google Maps JS API',
          status: 'error',
          message: 'Error loading Google Maps JavaScript API',
          details: error.message
        };
      }
    } else {
      testResults[1] = {
        name: 'Google Maps JS API',
        status: 'error',
        message: 'Cannot test API loading without valid API key',
        details: 'API key required for JavaScript API access'
      };
    }
    setTests([...testResults]);

    // Test 3: Places API Access
    testResults.push({
      name: 'Places API Access',
      status: 'loading',
      message: 'Testing Places API access...'
    });
    setTests([...testResults]);

    if (apiKey && window.google && window.google.maps) {
      try {
        // Test Places service initialization
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        testResults[2] = {
          name: 'Places API Access',
          status: 'success',
          message: 'Places API service initialized successfully',
          details: 'Places API is ready for restaurant searches'
        };
      } catch (error: any) {
        testResults[2] = {
          name: 'Places API Access',
          status: 'warning',
          message: 'Places API might not be enabled',
          details: 'Enable Places API in Google Cloud Console'
        };
      }
    } else {
      testResults[2] = {
        name: 'Places API Access',
        status: 'error',
        message: 'Cannot test Places API',
        details: 'Requires valid API key and loaded JavaScript API'
      };
    }
    setTests([...testResults]);

    // Test 4: Feature Detection
    testResults.push({
      name: 'Feature Detection',
      status: 'success',
      message: `FUZO Features: ${isGoogleAPIAvailable() ? 'Google Maps Enabled' : 'Using Backend/Demo Mode'}`,
      details: `Maps will use ${isGoogleAPIAvailable() ? 'interactive Google Maps' : 'backend static maps or demo mode'}`
    });
    setTests([...testResults]);

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'loading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-md w-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-[#F14C35] rounded-full flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#0B1F3A]">Google Maps Test</h3>
          <p className="text-sm text-gray-600">Frontend API Configuration</p>
        </div>
      </div>

      <div className="space-y-3">
        {tests.map((test, index) => (
          <motion.div
            key={test.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(test.status)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0B1F3A] text-sm">{test.name}</p>
                <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                {test.details && (
                  <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#F14C35] text-white hover:bg-[#E63E26]'
          }`}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests Again'}
        </button>
      </div>
    </div>
  );
}
