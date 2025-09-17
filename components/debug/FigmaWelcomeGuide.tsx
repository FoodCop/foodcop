import React, { useState, useEffect } from 'react';
import { Info, Copy, ExternalLink, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { analyzeFigmaEnvironment, markFigmaUrlAsConfigured } from '../utils/figmaOAuthHelper';

export function FigmaWelcomeGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const info = analyzeFigmaEnvironment();
    if (info.isFigmaPreview && info.needsConfiguration) {
      setCurrentUrl(info.currentUrl);
      
      // Check if user has dismissed this guide recently (last 24 hours)
      const lastDismissed = localStorage.getItem('fuzo-figma-guide-dismissed');
      const shouldShow = !lastDismissed || 
        (Date.now() - parseInt(lastDismissed)) > 24 * 60 * 60 * 1000;
      
      if (shouldShow) {
        // Show guide after a brief delay
        setTimeout(() => setIsVisible(true), 2000);
      }
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('fuzo-figma-guide-dismissed', Date.now().toString());
  };

  const handleMarkAsConfigured = () => {
    markFigmaUrlAsConfigured();
    setIsVisible(false);
    localStorage.setItem('fuzo-figma-guide-dismissed', Date.now().toString());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="border-blue-200 bg-white max-w-lg mx-auto shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              Welcome to FUZO on Figma!
            </CardTitle>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-800 text-sm mb-3">
              <strong>🎨 Figma Preview Detected!</strong><br />
              For Google Sign-In to work, we need to add this preview URL to Google Console.
            </p>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-white text-xs font-mono">
                {currentUrl}
              </Badge>
              <Button
                onClick={() => copyToClipboard(`https://${currentUrl}`)}
                size="sm"
                variant="outline"
                className="gap-1 h-7"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-2">
                📋 Quick Setup Steps:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                <li>Click "Open Google Console" below</li>
                <li>Navigate to your OAuth 2.0 Client ID</li>
                <li>Under "Authorized JavaScript origins" → ADD URI</li>
                <li>Paste: <code className="bg-gray-100 px-1 rounded text-xs">https://{currentUrl}</code></li>
                <li>Save and wait 1-2 minutes</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              className="gap-2 flex-1"
              size="sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Google Console
            </Button>
            <Button 
              onClick={handleMarkAsConfigured}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              I've Set It Up
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>
              <strong>💡 Alternative:</strong> You can test locally at{' '}
              <code className="bg-gray-100 px-1 rounded">localhost:5173</code> (already configured)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
