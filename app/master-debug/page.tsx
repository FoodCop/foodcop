"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Shield, Map, Bot, Users, Zap } from "lucide-react";
import { SystemStatusTab } from "./components/SystemStatusTab";
import { AuthenticationTab } from "./components/AuthenticationTab";

// Force dynamic rendering for debug pages
export const dynamic = 'force-dynamic';
import { MapsLocationTab } from "./components/MapsLocationTab";
import { RecipesAITab } from "./components/RecipesAITab";
import { SocialFeaturesTab } from "./components/SocialFeaturesTab";
import { PerformanceTab } from "./components/PerformanceTab";
import { DebugService } from "./lib/debug-service";
import type { SystemHealth } from "./lib/types";

export default function MasterDebugDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("system");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    setLoading(true);
    try {
      const health = await DebugService.getSystemHealth();
      setSystemHealth(health);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to load system health:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOverallHealthStatus = () => {
    if (!systemHealth) return "unknown";
    
    const criticalServices = [
      systemHealth.environment.supabase,
      systemHealth.database.connection,
      systemHealth.auth.supabaseAuth
    ];
    
    if (criticalServices.every(service => service)) return "healthy";
    if (criticalServices.some(service => service)) return "warning";
    return "critical";
  };

  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case "healthy": return "default";
      case "warning": return "secondary";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Master Debug Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive development and debugging interface
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })}
          </div>
          <Badge variant={getHealthBadgeVariant(getOverallHealthStatus())}>
            {getOverallHealthStatus().toUpperCase()}
          </Badge>
          <Button
            onClick={loadSystemHealth}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      {systemHealth && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">APIs</div>
                <div className="text-2xl font-bold">
                  {Object.values(systemHealth.apis).filter((api: any) => api?.connected).length}/
                  {Object.keys(systemHealth.apis).length}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Auth</div>
                <div className="text-2xl font-bold">
                  {systemHealth.auth.supabaseAuth ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium">Maps</div>
                <div className="text-2xl font-bold">
                  {systemHealth.apis.googleMaps?.connected ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium">AI</div>
                <div className="text-2xl font-bold">
                  {systemHealth.apis.openai?.connected ? '✓' : '✗'}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-pink-500" />
              <div>
                <div className="text-sm font-medium">Users</div>
                <div className="text-2xl font-bold">
                  {systemHealth.database.userCount || 0}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">Cache</div>
                <div className="text-2xl font-bold">
                  {systemHealth.performance.cacheHitRate || 0}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Auth
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Maps
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI/Recipes
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemStatusTab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>

        <TabsContent value="auth">
          <AuthenticationTab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>

        <TabsContent value="maps">
          <MapsLocationTab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>

        <TabsContent value="ai">
          <RecipesAITab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>

        <TabsContent value="social">
          <SocialFeaturesTab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab systemHealth={systemHealth} onRefresh={loadSystemHealth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}