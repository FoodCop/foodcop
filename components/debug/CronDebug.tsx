'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CronJob, CronStats } from '@/lib/cron/types';

export default function CronDebug() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [stats, setStats] = useState<CronStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/cron/jobs');
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.data.jobs);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/cron/logs?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const initializeCron = async () => {
    try {
      const response = await fetch('/api/cron/init', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        await fetchJobs();
        alert('CRON jobs initialized successfully');
      } else {
        alert('Failed to initialize CRON jobs');
      }
    } catch (error) {
      console.error('Failed to initialize CRON:', error);
      alert('Failed to initialize CRON jobs');
    }
  };

  const toggleJob = async (jobId: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'enable' : 'disable';
      const response = await fetch(`/api/cron/jobs/${jobId}/${endpoint}`, { 
        method: 'POST' 
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchJobs();
      } else {
        alert(`Failed to ${enabled ? 'enable' : 'disable'} job`);
      }
    } catch (error) {
      console.error('Failed to toggle job:', error);
      alert('Failed to toggle job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'idle': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'disabled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchLogs();
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading CRON debug info...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRON Job Manager</CardTitle>
          <CardDescription>
            Manage and monitor scheduled tasks for FoodCop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={initializeCron}>
              Initialize CRON Jobs
            </Button>
            <Button onClick={fetchJobs} variant="outline">
              Refresh Jobs
            </Button>
            <Button onClick={fetchLogs} variant="outline">
              Refresh Logs
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <div className="text-sm text-gray-500">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activeJobs}</div>
                <div className="text-sm text-gray-500">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.runningJobs}</div>
                <div className="text-sm text-gray-500">Running Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failedExecutions}</div>
                <div className="text-sm text-gray-500">Failed Executions</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{job.name}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        <Badge variant={job.enabled ? "default" : "secondary"}>
                          {job.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                      <div className="text-xs text-gray-500">
                        <div>Schedule: {job.schedule}</div>
                        {job.lastRun && (
                          <div>Last Run: {new Date(job.lastRun).toLocaleString()}</div>
                        )}
                        {job.nextRun && (
                          <div>Next Run: {new Date(job.nextRun).toLocaleString()}</div>
                        )}
                        {job.error && (
                          <div className="text-red-500">Error: {job.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={job.enabled ? "destructive" : "default"}
                        onClick={() => toggleJob(job.id, !job.enabled)}
                      >
                        {job.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Logs</CardTitle>
          <CardDescription>
            Latest CRON job execution logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
                <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                  {log.level}
                </Badge>
                <span className="flex-1">{log.message}</span>
                {log.jobId && (
                  <Badge variant="outline">{log.jobId}</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

