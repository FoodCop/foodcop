"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import type { SystemHealth } from "../lib/types";

interface SystemStatusTabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function SystemStatusTab({ systemHealth, onRefresh }: SystemStatusTabProps) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | undefined) => {
    if (status === undefined) return "Unknown";
    return status ? "Connected" : "Failed";
  };

  const getStatusVariant = (status: boolean | undefined) => {
    if (status === undefined) return "secondary";
    return status ? "default" : "destructive";
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                🔧 Environment Configuration
              </CardTitle>
              <CardDescription>
                Essential environment variables and their status
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Supabase URL</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.supabaseUrl)}
                <Badge variant={getStatusVariant(systemHealth.environment.supabaseUrl)}>
                  {getStatusText(systemHealth.environment.supabaseUrl)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Supabase Anon Key</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.supabaseAnonKey)}
                <Badge variant={getStatusVariant(systemHealth.environment.supabaseAnonKey)}>
                  {getStatusText(systemHealth.environment.supabaseAnonKey)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Google Maps API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.googleMaps)}
                <Badge variant={getStatusVariant(systemHealth.environment.googleMaps)}>
                  {getStatusText(systemHealth.environment.googleMaps)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">OpenAI API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.openai)}
                <Badge variant={getStatusVariant(systemHealth.environment.openai)}>
                  {getStatusText(systemHealth.environment.openai)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Spoonacular API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.spoonacular)}
                <Badge variant={getStatusVariant(systemHealth.environment.spoonacular)}>
                  {getStatusText(systemHealth.environment.spoonacular)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Google OAuth</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemHealth.environment.googleClientId)}
                <Badge variant={getStatusVariant(systemHealth.environment.googleClientId)}>
                  {getStatusText(systemHealth.environment.googleClientId)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌐 API Connection Status
          </CardTitle>
          <CardDescription>
            Real-time status of external API connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(systemHealth.apis).map(([apiName, status]) => (
              <div key={apiName} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.connected)}
                  <div>
                    <h4 className="font-medium capitalize">
                      {apiName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {status.error || `Response time: ${status.responseTime}ms`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(status.connected)}>
                    {getStatusText(status.connected)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/api/debug/${apiName.toLowerCase()}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗄️ Database Status
          </CardTitle>
          <CardDescription>
            Database connectivity and basic statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {systemHealth.database.connection ? '✓' : '✗'}
              </div>
              <div className="text-sm text-muted-foreground">Connection</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {systemHealth.database.tablesCount}
              </div>
              <div className="text-sm text-muted-foreground">Tables</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {systemHealth.database.userCount}
              </div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
          </div>
          
          {systemHealth.database.error && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Database Error: {systemHealth.database.error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Quick Actions
          </CardTitle>
          <CardDescription>
            Common debug operations and utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/env-vars', '_blank')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">🔧</span>
              <span className="text-sm">Check Env</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/supabase', '_blank')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">🗄️</span>
              <span className="text-sm">Test DB</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/database-tables', '_blank')}
              className="h-auto flex-col gap-2 p-4"
            >
              <span className="text-lg">📊</span>
              <span className="text-sm">List Tables</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="h-auto flex-col gap-2 p-4"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh All</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}