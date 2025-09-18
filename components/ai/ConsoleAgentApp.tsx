import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Bug, Settings, Zap } from "lucide-react";
import React, { useCallback, useState } from "react";

import AutoFixAgent from "./AutoFixAgent";
import ConsoleAgent from "./ConsoleAgent";
import ErrorDashboard from "./ErrorDashboard";
import RealTimeConsoleMonitor from "./RealTimeConsoleMonitor";

interface ConsoleLog {
  id: string;
  timestamp: Date;
  type: "log" | "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  args: any[];
  stack?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "api" | "ui" | "network" | "auth" | "build" | "runtime" | "other";
}

interface ConsoleAgentAppProps {
  wsUrl?: string;
  enableRealTime?: boolean;
  enableAutoFix?: boolean;
  enableDashboard?: boolean;
  onFixApplied?: (fix: string) => void;
  onCodeChange?: (filePath: string, newCode: string) => void;
}

export const ConsoleAgentApp: React.FC<ConsoleAgentAppProps> = ({
  wsUrl = "ws://localhost:3001/console",
  enableRealTime = true,
  enableAutoFix = true,
  enableDashboard = true,
  onFixApplied,
  onCodeChange,
}) => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [errors, setErrors] = useState<ConsoleLog[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState("monitor");

  const handleLogReceived = useCallback((log: any) => {
    const consoleLog: ConsoleLog = {
      id: log.id || `log-${Date.now()}`,
      timestamp: log.timestamp || new Date(),
      type: log.type || "log",
      source: log.source || "unknown",
      message: log.message || "Unknown log",
      args: log.args || [],
      stack: log.stack,
      severity: log.severity || "low",
      category: log.category || "other",
    };
    setLogs((prev) => [consoleLog, ...prev]);

    if (
      consoleLog.type === "error" ||
      consoleLog.severity === "high" ||
      consoleLog.severity === "critical"
    ) {
      setErrors((prev) => [consoleLog, ...prev]);
    }
  }, []);

  const handleErrorDetected = useCallback((error: any) => {
    const consoleLog: ConsoleLog = {
      id: error.id || `error-${Date.now()}`,
      timestamp: error.timestamp || new Date(),
      type: error.type || "error",
      source: error.source || "unknown",
      message: error.message || "Unknown error",
      args: error.args || [],
      stack: error.stack,
      severity: error.severity || "high",
      category: error.category || "other",
    };
    setErrors((prev) => [consoleLog, ...prev]);
  }, []);

  const handleFixApplied = useCallback(
    (fix: string) => {
      console.log("Fix applied:", fix);
      if (onFixApplied) {
        onFixApplied(fix);
      }
    },
    [onFixApplied]
  );

  const handleCodeChange = useCallback(
    (filePath: string, newCode: string) => {
      console.log("Code change requested:", filePath);
      if (onCodeChange) {
        onCodeChange(filePath, newCode);
      }
    },
    [onCodeChange]
  );

  const clearAllLogs = useCallback(() => {
    setLogs([]);
    setErrors([]);
  }, []);

  const errorCount = errors.length;
  const criticalErrors = errors.filter((e) => e.severity === "critical").length;
  const highSeverityErrors = errors.filter(
    (e) => e.severity === "high" || e.severity === "critical"
  ).length;

  const getStatusColor = () => {
    if (criticalErrors > 0) return "bg-red-100 text-red-800 border-red-200";
    if (highSeverityErrors > 0)
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (errorCount > 0)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusText = () => {
    if (criticalErrors > 0)
      return `${criticalErrors} Critical Error${criticalErrors > 1 ? "s" : ""}`;
    if (highSeverityErrors > 0)
      return `${highSeverityErrors} High Severity Error${
        highSeverityErrors > 1 ? "s" : ""
      }`;
    if (errorCount > 0)
      return `${errorCount} Error${errorCount > 1 ? "s" : ""}`;
    return "No Errors";
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bug className="h-8 w-8 text-blue-600" />
            AI Console Agent
          </h1>
          <p className="text-gray-600 mt-1">
            Intelligent error monitoring, analysis, and automatic fixing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>

          <Button
            variant={isActive ? "destructive" : "default"}
            onClick={() => setIsActive(!isActive)}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isActive ? "Stop" : "Start"} Monitoring
          </Button>

          <Button onClick={clearAllLogs} variant="outline" size="sm">
            Clear All
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bug className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-xl font-bold">{errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  High Severity
                </p>
                <p className="text-xl font-bold">{highSeverityErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-xl font-bold">{criticalErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Console Monitor
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="autofix" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Auto-Fix
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <ConsoleAgent isActive={isActive} onFixApplied={handleFixApplied} />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          {enableRealTime ? (
            <RealTimeConsoleMonitor
              wsUrl={wsUrl}
              onErrorDetected={handleErrorDetected}
              onLogReceived={handleLogReceived}
            />
          ) : (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Real-time monitoring is disabled. Enable it in the component
                props to use WebSocket-based console monitoring.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="autofix" className="space-y-4">
          {enableAutoFix ? (
            <AutoFixAgent
              errors={errors.map((error) => ({
                message: error.message,
                stack: error.stack,
                file: error.source,
                line: undefined, // Could be extracted from stack trace
              }))}
              onFixApplied={(fix) =>
                handleFixApplied(fix.title || fix.description)
              }
              onCodeChange={handleCodeChange}
            />
          ) : (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Auto-fix functionality is disabled. Enable it in the component
                props to use AI-powered error fixing.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          {enableDashboard ? (
            <ErrorDashboard
              errors={errors.map((error) => ({
                id: error.id,
                message: error.message,
                type: error.type,
                category: error.category,
                severity: error.severity,
                timestamp: error.timestamp,
                source: error.source,
                stack: error.stack,
              }))}
              onFixApplied={(fixId) => {
                console.log("Fix applied from dashboard:", fixId);
                handleFixApplied(fixId);
              }}
            />
          ) : (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Dashboard functionality is disabled. Enable it in the component
                props to use the error analytics dashboard.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription>
            Common actions for managing console monitoring and error handling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setActiveTab("monitor")}
              variant="outline"
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              View Console
            </Button>

            <Button
              onClick={() => setActiveTab("autofix")}
              variant="outline"
              size="sm"
              disabled={errors.length === 0}
            >
              <Bug className="h-4 w-4 mr-2" />
              Fix Errors ({errors.length})
            </Button>

            <Button
              onClick={() => setActiveTab("dashboard")}
              variant="outline"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>

            <Button onClick={clearAllLogs} variant="outline" size="sm">
              Clear All Data
            </Button>

            <Button
              onClick={() => {
                const data = {
                  logs,
                  errors,
                  timestamp: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `console-agent-data-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              variant="outline"
              size="sm"
            >
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsoleAgentApp;
