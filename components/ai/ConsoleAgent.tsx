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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Code,
  Download,
  Eye,
  EyeOff,
  Lightbulb,
  Trash2,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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

interface ErrorAnalysis {
  pattern: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedFixes: string[];
  codeSuggestions: string[];
  relatedFiles: string[];
  confidence: number;
}

interface ConsoleAgentProps {
  isActive?: boolean;
  onFixApplied?: (fix: string) => void;
}

export const ConsoleAgent: React.FC<ConsoleAgentProps> = ({
  isActive = true,
  onFixApplied,
}) => {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [analysis, setAnalysis] = useState<ErrorAnalysis[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConsoleLog | null>(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const logIdCounter = useRef(0);

  // Error pattern recognition
  const errorPatterns = {
    api: {
      patterns: [
        /API.*error/i,
        /fetch.*failed/i,
        /network.*error/i,
        /timeout/i,
        /404|500|502|503|504/i,
      ],
      category: "api" as const,
      severity: "high" as const,
    },
    auth: {
      patterns: [
        /unauthorized/i,
        /forbidden/i,
        /token.*expired/i,
        /authentication.*failed/i,
        /401|403/i,
      ],
      category: "auth" as const,
      severity: "high" as const,
    },
    network: {
      patterns: [
        /CORS/i,
        /cross-origin/i,
        /connection.*refused/i,
        /network.*unreachable/i,
      ],
      category: "network" as const,
      severity: "medium" as const,
    },
    build: {
      patterns: [
        /module.*not found/i,
        /import.*error/i,
        /compilation.*error/i,
        /syntax.*error/i,
        /TypeScript.*error/i,
      ],
      category: "build" as const,
      severity: "critical" as const,
    },
    runtime: {
      patterns: [
        /undefined.*is not a function/i,
        /cannot read.*property/i,
        /null.*reference/i,
        /TypeError/i,
        /ReferenceError/i,
      ],
      category: "runtime" as const,
      severity: "high" as const,
    },
  };

  const categorizeLog = (
    message: string
  ): { category: ConsoleLog["category"]; severity: ConsoleLog["severity"] } => {
    for (const [key, pattern] of Object.entries(errorPatterns)) {
      if (pattern.patterns.some((p) => p.test(message))) {
        return { category: pattern.category, severity: pattern.severity };
      }
    }
    return { category: "other", severity: "low" };
  };

  const analyzeError = useCallback((log: ConsoleLog): ErrorAnalysis => {
    const { category, severity } = categorizeLog(log.message);

    const suggestions: string[] = [];
    const codeSuggestions: string[] = [];
    const relatedFiles: string[] = [];

    // Generate specific suggestions based on error type
    if (category === "api") {
      suggestions.push("Check API endpoint URL and ensure it's accessible");
      suggestions.push("Verify API key configuration in environment variables");
      suggestions.push("Check network connectivity and CORS settings");

      if (log.message.includes("404")) {
        codeSuggestions.push(`
// Check if endpoint exists and is correctly configured
const response = await fetch('/api/endpoint', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${apiKey}\`
  }
});

if (!response.ok) {
  throw new Error(\`API Error: \${response.status} - \${response.statusText}\`);
}
        `);
      }
    } else if (category === "auth") {
      suggestions.push("Verify authentication token is valid and not expired");
      suggestions.push("Check user permissions and role assignments");
      suggestions.push("Ensure proper authentication flow is implemented");

      codeSuggestions.push(`
// Add proper error handling for auth failures
try {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('User not authenticated');
  }
} catch (error) {
  console.error('Auth error:', error);
  // Redirect to login or show auth modal
}
      `);
    } else if (category === "build") {
      suggestions.push("Check import statements and file paths");
      suggestions.push("Verify TypeScript configuration and types");
      suggestions.push("Ensure all dependencies are properly installed");

      if (log.message.includes("module not found")) {
        codeSuggestions.push(`
// Check import path and ensure file exists
import { Component } from './path/to/component';
// or
import Component from './path/to/component';
        `);
      }
    } else if (category === "runtime") {
      suggestions.push("Add null checks and defensive programming");
      suggestions.push("Verify object properties exist before accessing");
      suggestions.push("Check for proper error boundaries");

      if (log.message.includes("undefined is not a function")) {
        codeSuggestions.push(`
// Add type checking before function calls
if (typeof someFunction === 'function') {
  someFunction();
} else {
  console.warn('Function not available');
}
        `);
      }
    }

    return {
      pattern: log.message.substring(0, 100),
      description: `Error in ${category} category: ${log.message}`,
      severity,
      suggestedFixes: suggestions,
      codeSuggestions,
      relatedFiles,
      confidence: 0.8,
    };
  }, []);

  const addLog = useCallback(
    (
      type: ConsoleLog["type"],
      source: string,
      message: string,
      args: any[] = [],
      stack?: string
    ) => {
      const { category, severity } = categorizeLog(message);

      const newLog: ConsoleLog = {
        id: `log-${++logIdCounter.current}`,
        timestamp: new Date(),
        type,
        source,
        message,
        args,
        stack,
        severity,
        category,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs

      // Auto-analyze high severity errors
      if (severity === "high" || severity === "critical") {
        const errorAnalysis = analyzeError(newLog);
        setAnalysis((prev) => [errorAnalysis, ...prev].slice(0, 50));
      }
    },
    [analyzeError]
  );

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    // Store original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };

    // Override console methods
    console.log = (...args) => {
      addLog("log", "console.log", args.join(" "), args);
      originalConsole.log(...args);
    };

    console.info = (...args) => {
      addLog("info", "console.info", args.join(" "), args);
      originalConsole.info(...args);
    };

    console.warn = (...args) => {
      addLog("warn", "console.warn", args.join(" "), args);
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      const stack = new Error().stack;
      addLog("error", "console.error", args.join(" "), args, stack);
      originalConsole.error(...args);
    };

    console.debug = (...args) => {
      addLog("debug", "console.debug", args.join(" "), args);
      originalConsole.debug(...args);
    };

    // Capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      addLog(
        "error",
        "window.error",
        event.message,
        [event],
        event.error?.stack
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog(
        "error",
        "unhandledrejection",
        `Promise rejection: ${event.reason}`,
        [event.reason]
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    setIsMonitoring(true);

    // Return cleanup function
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;

      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
      setIsMonitoring(false);
    };
  }, [isMonitoring, addLog]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setAnalysis([]);
  }, []);

  const exportLogs = useCallback(() => {
    const logData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: logs,
      analysis: analysis,
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-agent-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, analysis]);

  const applyFix = useCallback(
    (fix: string) => {
      if (onFixApplied) {
        onFixApplied(fix);
      }
      // You could integrate with your code editor here
      console.log("Fix applied:", fix);
    },
    [onFixApplied]
  );

  const getSeverityColor = (severity: ConsoleLog["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getTypeIcon = (type: ConsoleLog["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "debug":
        return <Bug className="h-4 w-4 text-purple-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    if (isActive && !isMonitoring) {
      const cleanup = startMonitoring();
      return cleanup;
    }
  }, [isActive, isMonitoring, startMonitoring]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                AI Console Agent
              </CardTitle>
              <CardDescription>
                Intelligent error monitoring and automatic fix suggestions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                size="sm"
              >
                {isMonitoring ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {isMonitoring ? "Stop" : "Start"} Monitoring
              </Button>
              <Button variant="outline" onClick={clearLogs} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" onClick={exportLogs} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs">
                Console Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                Error Analysis ({analysis.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">Fix Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedLog?.id === log.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                            <Badge
                              className={`text-xs ${getSeverityColor(
                                log.severity
                              )}`}
                            >
                              {log.severity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-mono break-words">
                            {log.message}
                          </p>
                          {log.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer">
                                Stack Trace
                              </summary>
                              <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {analysis.map((item, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            {item.pattern}
                          </CardTitle>
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                        </div>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2">
                              Suggested Fixes:
                            </h4>
                            <ul className="space-y-1">
                              {item.suggestedFixes.map((fix, fixIndex) => (
                                <li
                                  key={fixIndex}
                                  className="text-sm text-gray-600 flex items-start gap-2"
                                >
                                  <Lightbulb className="h-3 w-3 mt-1 text-yellow-500" />
                                  {fix}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {item.codeSuggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">
                                Code Suggestions:
                              </h4>
                              <div className="space-y-2">
                                {item.codeSuggestions.map((code, codeIndex) => (
                                  <pre
                                    key={codeIndex}
                                    className="text-xs bg-gray-100 p-2 rounded overflow-x-auto"
                                  >
                                    {code}
                                  </pre>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  AI-powered suggestions will appear here based on detected
                  errors. Enable auto-fix to automatically apply suggested
                  changes.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2">
                <Button
                  variant={autoFixEnabled ? "default" : "outline"}
                  onClick={() => setAutoFixEnabled(!autoFixEnabled)}
                  size="sm"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Fix: {autoFixEnabled ? "ON" : "OFF"}
                </Button>
                <Button
                  variant={showSuggestions ? "default" : "outline"}
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  size="sm"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Show Suggestions: {showSuggestions ? "ON" : "OFF"}
                </Button>
              </div>

              {showSuggestions && analysis.length > 0 && (
                <div className="space-y-4">
                  {analysis.slice(0, 5).map((item, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Fix for: {item.pattern}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {item.suggestedFixes.map((fix, fixIndex) => (
                            <div
                              key={fixIndex}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm">{fix}</span>
                              <Button
                                size="sm"
                                onClick={() => applyFix(fix)}
                                className="ml-2"
                              >
                                Apply
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsoleAgent;
