import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Info, ExternalLink } from 'lucide-react';
import { analyzeFigmaEnvironment, getFigmaConfigurationStatus } from '../utils/figmaOAuthHelper';

export function FigmaStatusBadge() {
  const [figmaInfo, setFigmaInfo] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const info = analyzeFigmaEnvironment();
    const configStatus = getFigmaConfigurationStatus();
    
    if (info.isFigmaPreview) {
      setFigmaInfo(info);
      setStatus(configStatus);
    }
  }, []);

  if (!figmaInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (status.currentMatches && status.isConfigured) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (figmaInfo.needsConfiguration) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getStatusText = () => {
    if (status.currentMatches && status.isConfigured) {
      return "✅ Figma OAuth Ready";
    } else if (figmaInfo.needsConfiguration) {
      return "⚠️ OAuth Setup Needed";
    }
    return "🎨 Figma Preview";
  };

  return (
    <div className="fixed top-4 left-4 z-40">
      <div className="flex items-center gap-2">
        <Badge className={`${getStatusColor()} font-mono text-xs`}>
          {getStatusText()}
        </Badge>
        
        {figmaInfo.needsConfiguration && (
          <Button
            onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
          >
            <ExternalLink className="w-3 h-3" />
            Setup
          </Button>
        )}
      </div>
      
      {figmaInfo.needsConfiguration && (
        <div className="mt-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1 max-w-xs">
          <p>Add <code className="bg-orange-100 px-1 rounded">https://{figmaInfo.currentUrl}</code> to Google Console for sign-in to work</p>
        </div>
      )}
    </div>
  );
}
