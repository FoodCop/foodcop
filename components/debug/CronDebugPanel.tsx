'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Database, RefreshCw, Calendar } from 'lucide-react';

interface CronStatus {
  schedule: string;
  nextRun: string;
  timeUntilNextRun: string;
  lastRunToday: boolean;
}

interface PostsInfo {
  recentPosts: Array<{
    id: string;
    restaurant_name: string;
    bot_display_name: string;
    created_at: string;
    post_content?: string;
  }>;
  recentPostsCount: number;
  totalPosts: number;
  last24Hours: number;
}

interface CronStatusData {
  success: boolean;
  cronStatus: CronStatus;
  posts: PostsInfo;
  timestamp: string;
}

export function CronDebugPanel() {
  const [statusData, setStatusData] = useState<CronStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/debug/cron-status');
      const data = await response.json();
      
      if (data.success) {
        setStatusData(data);
      } else {
        setError(data.error || 'Failed to fetch CRON status');
      }
    } catch (err) {
      setError('Failed to fetch CRON status');
      console.error('Error fetching CRON status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !statusData) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading CRON status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-destructive">CRON Status Error: {error}</span>
            <Button variant="outline" size="sm" onClick={fetchStatus}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusData) return null;

  const { cronStatus, posts } = statusData;

  return (
    <Card className="mb-4 bg-accent/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Master Bot CRON Status</span>
            <Badge variant={cronStatus.lastRunToday ? "default" : "secondary"}>
              {cronStatus.lastRunToday ? "Ran Today" : "Pending"}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Next Run</p>
              <p className="text-sm font-medium">{cronStatus.timeUntilNextRun}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Posts Today</p>
              <p className="text-sm font-medium">{posts.last24Hours}</p>
            </div>
          </div>
        </div>

        {expanded && (
          <>
            {/* Schedule Info */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-medium mb-2">Schedule Details</h4>
              <p className="text-xs text-muted-foreground mb-1">
                <strong>Schedule:</strong> {cronStatus.schedule}
              </p>
              <p className="text-xs text-muted-foreground mb-1">
                <strong>Next Run:</strong> {new Date(cronStatus.nextRun).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Total Posts:</strong> {posts.totalPosts}
              </p>
            </div>

            {/* Recent Posts */}
            {posts.recentPosts.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Recent Posts (Last 24h)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {posts.recentPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-2 bg-background rounded border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-xs font-medium">{post.restaurant_name}</p>
                          <p className="text-xs text-muted-foreground">by {post.bot_display_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="border-t pt-3 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}