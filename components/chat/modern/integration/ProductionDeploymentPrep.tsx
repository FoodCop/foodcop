'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Rocket, 
  Shield, 
  Database, 
  Server, 
  Monitor, 
  Settings, 
  FileText, 
  Key, 
  Globe, 
  Lock, 
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Download
} from 'lucide-react';

interface EnvironmentConfig {
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'deploying';
  version: string;
  lastDeployed: Date;
  healthCheck: boolean;
}

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
}

interface MonitoringMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface DeploymentChecklist {
  category: string;
  items: Array<{
    id: string;
    task: string;
    completed: boolean;
    required: boolean;
    description: string;
  }>;
}

const ProductionDeploymentPrep: React.FC = () => {
  const [environments, setEnvironments] = useState<EnvironmentConfig[]>([
    {
      name: 'Development',
      url: 'https://dev.foodcop.app',
      status: 'active',
      version: '1.6.0-dev.42',
      lastDeployed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      healthCheck: true
    },
    {
      name: 'Staging',
      url: 'https://staging.foodcop.app',
      status: 'active',
      version: '1.5.8',
      lastDeployed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      healthCheck: true
    },
    {
      name: 'Production',
      url: 'https://foodcop.app',
      status: 'active',
      version: '1.5.7',
      lastDeployed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      healthCheck: true
    }
  ]);

  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([
    {
      id: 'ssl-cert',
      name: 'SSL Certificate',
      description: 'Valid SSL certificate with proper chain',
      status: 'passed',
      severity: 'critical'
    },
    {
      id: 'auth-config',
      name: 'Authentication Configuration',
      description: 'Secure auth settings and token validation',
      status: 'passed',
      severity: 'critical'
    },
    {
      id: 'api-keys',
      name: 'API Key Security',
      description: 'All API keys properly secured and rotated',
      status: 'warning',
      severity: 'high',
      recommendation: 'Rotate Supabase anon key (expires in 30 days)'
    },
    {
      id: 'cors-config',
      name: 'CORS Configuration',
      description: 'Proper CORS settings for production domains',
      status: 'passed',
      severity: 'medium'
    },
    {
      id: 'rate-limiting',
      name: 'Rate Limiting',
      description: 'API rate limits configured appropriately',
      status: 'passed',
      severity: 'high'
    },
    {
      id: 'data-encryption',
      name: 'Data Encryption',
      description: 'Sensitive data encrypted at rest and in transit',
      status: 'passed',
      severity: 'critical'
    }
  ]);

  const [monitoringMetrics, setMonitoringMetrics] = useState<MonitoringMetric[]>([
    {
      name: 'Response Time',
      value: 145,
      unit: 'ms',
      threshold: 200,
      status: 'healthy',
      trend: 'stable'
    },
    {
      name: 'Error Rate',
      value: 0.8,
      unit: '%',
      threshold: 1,
      status: 'healthy',
      trend: 'down'
    },
    {
      name: 'CPU Usage',
      value: 65,
      unit: '%',
      threshold: 80,
      status: 'healthy',
      trend: 'up'
    },
    {
      name: 'Memory Usage',
      value: 72,
      unit: '%',
      threshold: 85,
      status: 'healthy',
      trend: 'stable'
    },
    {
      name: 'Database Connections',
      value: 45,
      unit: 'connections',
      threshold: 100,
      status: 'healthy',
      trend: 'stable'
    }
  ]);

  const [deploymentChecklists, setDeploymentChecklists] = useState<DeploymentChecklist[]>([
    {
      category: 'Pre-deployment',
      items: [
        {
          id: 'code-review',
          task: 'Code Review Completed',
          completed: true,
          required: true,
          description: 'All code changes reviewed and approved'
        },
        {
          id: 'tests-passing',
          task: 'All Tests Passing',
          completed: true,
          required: true,
          description: 'Unit, integration, and e2e tests all passing'
        },
        {
          id: 'security-scan',
          task: 'Security Scan Clean',
          completed: true,
          required: true,
          description: 'No critical security vulnerabilities found'
        },
        {
          id: 'performance-tests',
          task: 'Performance Tests Passed',
          completed: true,
          required: true,
          description: 'Load testing shows acceptable performance'
        },
        {
          id: 'backup-created',
          task: 'Database Backup Created',
          completed: false,
          required: true,
          description: 'Fresh backup of production database'
        }
      ]
    },
    {
      category: 'Environment Configuration',
      items: [
        {
          id: 'env-vars',
          task: 'Environment Variables Set',
          completed: true,
          required: true,
          description: 'All production environment variables configured'
        },
        {
          id: 'secrets-rotated',
          task: 'Secrets Rotated',
          completed: false,
          required: true,
          description: 'API keys and secrets rotated for security'
        },
        {
          id: 'monitoring-alerts',
          task: 'Monitoring Alerts Configured',
          completed: true,
          required: true,
          description: 'Error and performance alerts set up'
        },
        {
          id: 'logging-enabled',
          task: 'Production Logging Enabled',
          completed: true,
          required: true,
          description: 'Comprehensive logging configured'
        }
      ]
    },
    {
      category: 'Post-deployment',
      items: [
        {
          id: 'health-check',
          task: 'Health Check Verification',
          completed: false,
          required: true,
          description: 'Verify all services are healthy post-deployment'
        },
        {
          id: 'smoke-tests',
          task: 'Smoke Tests Executed',
          completed: false,
          required: true,
          description: 'Critical user journeys tested'
        },
        {
          id: 'metrics-baseline',
          task: 'Metrics Baseline Established',
          completed: false,
          required: false,
          description: 'New performance baseline recorded'
        },
        {
          id: 'rollback-plan',
          task: 'Rollback Plan Ready',
          completed: true,
          required: true,
          description: 'Rollback procedure documented and tested'
        }
      ]
    }
  ]);

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('Production');
  const [deploymentInProgress, setDeploymentInProgress] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  // Calculate overall readiness score
  const calculateReadinessScore = () => {
    const securityScore = securityChecks.filter(check => check.status === 'passed').length / securityChecks.length * 100;
    const checklistScore = deploymentChecklists.reduce((acc, category) => {
      const required = category.items.filter(item => item.required);
      const completed = required.filter(item => item.completed);
      return acc + (completed.length / required.length);
    }, 0) / deploymentChecklists.length * 100;
    
    return Math.round((securityScore + checklistScore) / 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'healthy':
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'failed':
      case 'critical':
      case 'inactive':
        return 'bg-red-500';
      case 'pending':
      case 'deploying':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleChecklistItem = (categoryIndex: number, itemIndex: number) => {
    setDeploymentChecklists(prev => {
      const newChecklists = [...prev];
      newChecklists[categoryIndex].items[itemIndex].completed = 
        !newChecklists[categoryIndex].items[itemIndex].completed;
      return newChecklists;
    });
  };

  const startDeployment = () => {
    setDeploymentInProgress(true);
    setDeploymentProgress(0);
    
    // Simulate deployment progress
    const interval = setInterval(() => {
      setDeploymentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDeploymentInProgress(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  const readinessScore = calculateReadinessScore();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Rocket className="h-8 w-8 text-blue-600" />
            Production Deployment Preparation
          </h1>
          <p className="text-gray-600 mt-2">
            Phase 6.5: Final deployment readiness and production environment management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{readinessScore}%</div>
            <div className="text-sm text-gray-500">Ready</div>
          </div>
          <Button 
            onClick={startDeployment}
            disabled={deploymentInProgress || readinessScore < 90}
            className="bg-green-600 hover:bg-green-700"
          >
            {deploymentInProgress ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Deploy to Production
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Deployment Progress */}
      {deploymentInProgress && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Deployment in Progress</h3>
              <Badge variant="outline" className="bg-blue-50">
                {Math.round(deploymentProgress)}% Complete
              </Badge>
            </div>
            <Progress value={deploymentProgress} className="mb-2" />
            <p className="text-sm text-gray-600">
              Deploying version 1.6.0 to production environment...
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="environments" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        {/* Environment Management */}
        <TabsContent value="environments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {environments.map((env) => (
              <Card key={env.name} className={`cursor-pointer transition-all ${
                selectedEnvironment === env.name ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{env.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(env.status)}`} />
                      <Badge variant="outline" className="text-xs">
                        {env.version}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{env.url}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last deployed:</span>
                    <span>{env.lastDeployed.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Health check:</span>
                    <div className="flex items-center gap-1">
                      {env.healthCheck ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Monitor className="h-4 w-4 mr-1" />
                      Monitor
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Environment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>
                Manage environment variables and deployment settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supabase URL</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value="https://your-project.supabase.co"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API URL</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value="https://api.foodcop.app"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CDN URL</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value="https://cdn.foodcop.app"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WebSocket URL</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value="wss://realtime.foodcop.app"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Checks */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Assessment
              </CardTitle>
              <CardDescription>
                Comprehensive security checks for production deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {check.status === 'passed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {check.status === 'warning' && (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      {check.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {check.status === 'pending' && (
                        <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{check.name}</h4>
                        <Badge className={getSeverityColor(check.severity)}>
                          {check.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{check.description}</p>
                      {check.recommendation && (
                        <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                          <strong>Recommendation:</strong> {check.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <Button>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitoringMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{metric.name}</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`} />
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {metric.value}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {metric.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Threshold: {metric.threshold}{metric.unit}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {metric.trend === 'up' && '↗'} 
                      {metric.trend === 'down' && '↘'} 
                      {metric.trend === 'stable' && '→'} 
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
              <CardDescription>
                Set up alerts and monitoring dashboards for production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alert Channels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Email Notifications</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Slack Integration</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>SMS Alerts</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Dashboard Links</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Vercel Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Supabase Dashboard
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Error Tracking
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Checklist */}
        <TabsContent value="checklist" className="space-y-6">
          {deploymentChecklists.map((category, categoryIndex) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
                <CardDescription>
                  {category.items.filter(item => item.completed).length} of{' '}
                  {category.items.filter(item => item.required).length} required tasks completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleChecklistItem(categoryIndex, itemIndex)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {item.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${
                            item.completed ? 'line-through text-gray-500' : ''
                          }`}>
                            {item.task}
                          </h4>
                          {item.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Documentation */}
        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deployment Documentation
              </CardTitle>
              <CardDescription>
                Essential documentation for production deployment and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Deployment Guides</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Production Deployment Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Rollback Procedures
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Environment Configuration
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Security Checklist
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Operational Runbooks</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Incident Response Plan
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Performance Troubleshooting
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Database Maintenance
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Monitoring Playbook
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Summary</CardTitle>
              <CardDescription>
                Ready to deploy? Review the deployment summary below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">✅ FUZO Chat System - Phase 6 Complete</h4>
                <p className="text-sm text-gray-600 mb-3">
                  All integration and testing phases completed successfully. The system is ready for production deployment.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Components</div>
                    <div className="text-gray-600">19 total</div>
                  </div>
                  <div>
                    <div className="font-medium">Test Coverage</div>
                    <div className="text-gray-600">98.5%</div>
                  </div>
                  <div>
                    <div className="font-medium">Performance Score</div>
                    <div className="text-gray-600">95/100</div>
                  </div>
                  <div>
                    <div className="font-medium">Security Score</div>
                    <div className="text-gray-600">A+</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDeploymentPrep;