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
  Activity,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ConsoleEvent {
  id: string;
  timestamp: Date;
  type: "log" | "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
  data?: any;
  stack?: string;
}

interface WebSocketMessage {
  type: "console" | "error" | "log" | "status";
  data: any;
  timestamp: number;
}

interface RealTimeConsoleMonitorProps {
  wsUrl?: string;
  onErrorDetected?: (error: ConsoleEvent) => void;
  onLogReceived?: (log: ConsoleEvent) => void;
  autoReconnect?: boolean;
  maxLogs?: number;
}

export const RealTimeConsoleMonitor: React.FC<RealTimeConsoleMonitorProps> = ({
  wsUrl = "ws://localhost:3001/console",
  onErrorDetected,
  onLogReceived,
  autoReconnect = true,
  maxLogs = 1000,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<ConsoleEvent[]>([]);
  const [errors, setErrors] = useState<ConsoleEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const addLog = useCallback(
    (event: ConsoleEvent) => {
      setLogs((prev) => {
        const newLogs = [event, ...prev].slice(0, maxLogs);
        return newLogs;
      });

      if (event.type === "error") {
        setErrors((prev) => [event, ...prev].slice(0, 100));
        if (onErrorDetected) {
          onErrorDetected(event);
        }
      }

      if (onLogReceived) {
        onLogReceived(event);
      }

      setLastActivity(new Date());
    },
    [maxLogs, onErrorDetected, onLogReceived]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🔌 WebSocket connected to console monitor");
        setIsConnected(true);
        setConnectionStatus("connected");
        setReconnectAttempts(0);

        // Send initial message to establish connection
        ws.send(
          JSON.stringify({
            type: "subscribe",
            data: { channels: ["console", "errors", "logs"] },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          const consoleEvent: ConsoleEvent = {
            id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(message.timestamp || Date.now()),
            type:
              message.type === "error"
                ? "error"
                : message.type === "log"
                ? "log"
                : "info",
            message: message.data?.message || JSON.stringify(message.data),
            source: message.data?.source || "websocket",
            data: message.data,
            stack: message.data?.stack,
          };

          addLog(consoleEvent);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus("disconnected");

        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts((prev) => prev + 1);
          setConnectionStatus("connecting");

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * Math.pow(2, reconnectAttempts)); // Exponential backoff
        }
      };

      ws.onerror = (error) => {
        console.error("🔌 WebSocket error:", error);
        setConnectionStatus("error");
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [
    wsUrl,
    autoReconnect,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectDelay,
    addLog,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setErrors([]);
  }, []);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "connecting":
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case "error":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Error";
      default:
        return "Disconnected";
    }
  };

  const getTypeIcon = (type: ConsoleEvent["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "debug":
        return <Activity className="h-4 w-4 text-purple-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: ConsoleEvent["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warn":
        return "bg-yellow-100 text-yellow-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      case "debug":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getConnectionStatusIcon()}
                Real-Time Console Monitor
              </CardTitle>
              <CardDescription>
                Live console monitoring via WebSocket connection
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={isConnected ? "bg-green-100 text-green-800" : ""}
              >
                {getConnectionStatusText()}
              </Badge>
              {reconnectAttempts > 0 && (
                <Badge variant="outline">
                  Retry {reconnectAttempts}/{maxReconnectAttempts}
                </Badge>
              )}
              <Button
                onClick={isConnected ? disconnect : connect}
                size="sm"
                variant={isConnected ? "destructive" : "default"}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
              <Button onClick={clearLogs} size="sm" variant="outline">
                Clear Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {connectionStatus === "error" && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to console monitor. Check if the WebSocket
                server is running on {wsUrl}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({errors.length})</TabsTrigger>
              <TabsTrigger value="realtime">Live Feed</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {getTypeIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={`text-xs ${getTypeColor(log.type)}`}
                            >
                              {log.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {log.source}
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

            <TabsContent value="errors" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className="p-3 rounded-lg border bg-red-50 border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              ERROR
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {error.source}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {error.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm font-mono break-words text-red-800">
                            {error.message}
                          </p>
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-red-600 cursor-pointer">
                                Stack Trace
                              </summary>
                              <pre className="text-xs text-red-700 mt-1 whitespace-pre-wrap bg-red-100 p-2 rounded">
                                {error.stack}
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

            <TabsContent value="realtime" className="space-y-4">
              <div className="h-96 bg-black text-green-400 font-mono text-sm p-4 rounded-lg overflow-auto">
                {logs.slice(0, 50).map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-500">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span
                      className={`ml-2 ${
                        log.type === "error"
                          ? "text-red-400"
                          : log.type === "warn"
                          ? "text-yellow-400"
                          : log.type === "info"
                          ? "text-blue-400"
                          : "text-green-400"
                      }`}
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500">
                    Waiting for console output...
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Connection Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getConnectionStatusIcon()}
                          <span className="text-sm">
                            {getConnectionStatusText()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          WebSocket URL: {wsUrl}
                        </div>
                        {reconnectAttempts > 0 && (
                          <div className="text-xs text-yellow-600">
                            Reconnect attempts: {reconnectAttempts}/
                            {maxReconnectAttempts}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">Total logs: {logs.length}</div>
                        <div className="text-sm">Errors: {errors.length}</div>
                        {lastActivity && (
                          <div className="text-xs text-gray-500">
                            Last activity: {lastActivity.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      WebSocket Server Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-gray-600 space-y-2">
                      <p>
                        To enable real-time console monitoring, you need a
                        WebSocket server that captures console output.
                      </p>
                      <p>Example server setup:</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {`const WebSocket = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 3001 });

// Capture console output from your app
const child = spawn('npm', ['run', 'dev'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'log',
        data: { message: data.toString(), source: 'stdout' },
        timestamp: Date.now()
      }));
    }
  });
});`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeConsoleMonitor;
