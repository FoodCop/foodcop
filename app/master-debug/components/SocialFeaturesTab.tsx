"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Users, MessageCircle, Heart } from "lucide-react";
import type { SystemHealth } from "../lib/types";

interface SocialFeaturesTabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function SocialFeaturesTab({ systemHealth, onRefresh }: SocialFeaturesTabProps) {
  const [userCount, setUserCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (systemHealth) {
      loadSocialStats();
    }
  }, [systemHealth]);

  const loadSocialStats = async () => {
    setLoading(true);
    try {
      // Load user statistics
      const usersResponse = await fetch('/api/debug/users');
      const usersData = await usersResponse.json();
      setUserCount(usersData.users?.length || 0);

      // TODO: Add friends and messages endpoints
      setFriendsCount(0);
      setMessagesCount(0);
    } catch (error) {
      console.error("Failed to load social stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const testChatMessage = async () => {
    if (!testMessage.trim()) return;

    setLoading(true);
    try {
      // This would test the chat system
      console.log("Testing chat message:", testMessage);
      // Add actual chat test logic here
    } catch (error) {
      console.error("Chat test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading social features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Social Features Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Social Features Status
              </CardTitle>
              <CardDescription>
                User management, friends, and chat system status
              </CardDescription>
            </div>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.database.connection)}
                <div>
                  <h4 className="font-medium">User System</h4>
                  <p className="text-sm text-muted-foreground">
                    User registration and profiles
                  </p>
                </div>
              </div>
              <Badge variant={systemHealth.database.connection ? "default" : "destructive"}>
                {systemHealth.database.connection ? "Active" : "Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.environment.stream)}
                <div>
                  <h4 className="font-medium">Chat System</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time messaging
                  </p>
                </div>
              </div>
              <Badge variant={systemHealth.environment.stream ? "default" : "destructive"}>
                {systemHealth.environment.stream ? "Configured" : "Not configured"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.auth.supabaseAuth)}
                <div>
                  <h4 className="font-medium">Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    User auth for social features
                  </p>
                </div>
              </div>
              <Badge variant={systemHealth.auth.supabaseAuth ? "default" : "destructive"}>
                {systemHealth.auth.supabaseAuth ? "Working" : "Failed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Social Statistics
          </CardTitle>
          <CardDescription>
            Current user engagement and social activity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {loading ? '...' : userCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {loading ? '...' : friendsCount}
              </div>
              <div className="text-sm text-muted-foreground">Friend Connections</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {loading ? '...' : messagesCount}
              </div>
              <div className="text-sm text-muted-foreground">Messages Sent</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                0
              </div>
              <div className="text-sm text-muted-foreground">Active Chats</div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={loadSocialStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
            <Button variant="outline" onClick={() => window.open('/users', '_blank')}>
              <Users className="h-4 w-4 mr-2" />
              View Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat System Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💬 Chat System Testing
          </CardTitle>
          <CardDescription>
            Test real-time messaging and chat functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Test Chat Message</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter test message"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && testChatMessage()}
                  />
                  <Button onClick={testChatMessage} disabled={loading || !testMessage.trim()}>
                    <MessageCircle className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Send
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.open('/chat', '_blank')}>
                    Open Chat
                  </Button>
                  <Button variant="outline" onClick={() => window.open('/friends', '_blank')}>
                    View Friends
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Friends System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👥 Friends System
          </CardTitle>
          <CardDescription>
            Friend connections and social plate sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <h4 className="font-medium">Friend Requests</h4>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Pending requests</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium">Active Friends</h4>
                <p className="text-2xl font-bold">{friendsCount}</p>
                <p className="text-sm text-muted-foreground">Connected users</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium">Shared Plates</h4>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Plates shared today</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                Test Friend Request
              </Button>
              <Button variant="outline">
                Test Plate Sharing
              </Button>
              <Button variant="outline" onClick={() => window.open('/api/debug/users', '_blank')}>
                View User Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Real-time Features
          </CardTitle>
          <CardDescription>
            WebSocket connections and live updates status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">WebSocket Status</h4>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Not connected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  WebSocket connection for real-time updates
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Live Updates</h4>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Polling mode</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Using polling for live features
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Stream Configuration</h4>
              <div className="text-sm space-y-1">
                <div>Stream API Key: {systemHealth.environment.stream ? '✓ Set' : '✗ Missing'}</div>
                <div>WebSocket URL: Not configured</div>
                <div>Connection Status: Disconnected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}