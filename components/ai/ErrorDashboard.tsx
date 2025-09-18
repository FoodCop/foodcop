import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useErrorPatternMatcher } from "./ErrorPatternMatcher";

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByHour: Array<{ hour: string; count: number }>;
  recentErrors: Array<{
    id: string;
    message: string;
    type: string;
    category: string;
    severity: string;
    timestamp: Date;
    source: string;
  }>;
  fixSuggestions: Array<{
    id: string;
    title: string;
    description: string;
    confidence: number;
    category: string;
    applied: boolean;
  }>;
  trends: {
    errorRate: number;
    fixRate: number;
    avgResolutionTime: number;
  };
}

interface ErrorDashboardProps {
  errors: Array<{
    id: string;
    message: string;
    type: string;
    category: string;
    severity: string;
    timestamp: Date;
    source: string;
    stack?: string;
  }>;
  onFixApplied?: (fixId: string) => void;
  onFilterChange?: (filters: {
    type?: string;
    category?: string;
    severity?: string;
    dateRange?: { start: Date; end: Date };
  }) => void;
}

const COLORS = {
  error: "#ef4444",
  warn: "#f59e0b",
  info: "#3b82f6",
  debug: "#8b5cf6",
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#16a34a",
  api: "#3b82f6",
  auth: "#dc2626",
  build: "#16a34a",
  runtime: "#f59e0b",
  network: "#8b5cf6",
  database: "#06b6d4",
  other: "#6b7280",
};

export const ErrorDashboard: React.FC<ErrorDashboardProps> = ({
  errors,
  onFixApplied,
  onFilterChange,
}) => {
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    severity: "",
    search: "",
  });
  const [dateRange] = useState<{ start: Date; end: Date } | null>(null);
  const { matchError, getSuggestions } = useErrorPatternMatcher();

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      if (filters.type && error.type !== filters.type) return false;
      if (filters.category && error.category !== filters.category) return false;
      if (filters.severity && error.severity !== filters.severity) return false;
      if (
        filters.search &&
        !error.message.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (dateRange) {
        const errorDate = new Date(error.timestamp);
        if (errorDate < dateRange.start || errorDate > dateRange.end)
          return false;
      }
      return true;
    });
  }, [errors, filters, dateRange]);

  const metrics: ErrorMetrics = useMemo(() => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentErrors = errors.filter(
      (e) => new Date(e.timestamp) >= last24Hours
    );

    // Calculate metrics
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByCategory = recentErrors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by hour
    const errorsByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, "0");
      const count = recentErrors.filter((e) => {
        const errorHour = new Date(e.timestamp).getHours();
        return errorHour === i;
      }).length;
      return { hour: `${hour}:00`, count };
    });

    // Generate fix suggestions
    const fixSuggestions = recentErrors
      .map((error) => {
        const pattern = matchError(error.message, error.stack);
        if (!pattern) return null;

        return {
          id: `fix-${error.id}`,
          title: pattern.name,
          description: pattern.description,
          confidence: pattern.confidence,
          category: pattern.category,
          applied: false,
        };
      })
      .filter(
        (suggestion): suggestion is NonNullable<typeof suggestion> =>
          suggestion !== null
      )
      .slice(0, 10);

    // Calculate trends
    const errorRate = recentErrors.length / 24; // errors per hour
    const fixRate = 0.7; // This would come from actual fix tracking
    const avgResolutionTime = 2.5; // This would come from actual resolution tracking

    return {
      totalErrors: recentErrors.length,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      errorsByHour,
      recentErrors: recentErrors.slice(0, 20),
      fixSuggestions,
      trends: {
        errorRate,
        fixRate,
        avgResolutionTime,
      },
    };
  }, [errors, matchError, getSuggestions]);

  const chartData = useMemo(() => {
    return Object.entries(metrics.errorsByType).map(([type, count]) => ({
      type: type.toUpperCase(),
      count,
      color: COLORS[type as keyof typeof COLORS] || COLORS.other,
    }));
  }, [metrics.errorsByType]);

  const categoryData = useMemo(() => {
    return Object.entries(metrics.errorsByCategory).map(
      ([category, count]) => ({
        category: category.toUpperCase(),
        count,
        color: COLORS[category as keyof typeof COLORS] || COLORS.other,
      })
    );
  }, [metrics.errorsByCategory]);

  // const severityData = useMemo(() => {
  //   return Object.entries(metrics.errorsBySeverity).map(([severity, count]) => ({
  //     severity: severity.toUpperCase(),
  //     count,
  //     color: COLORS[severity as keyof typeof COLORS] || COLORS.other
  //   }));
  // }, [metrics.errorsBySeverity]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange({
        ...newFilters,
        dateRange: dateRange || undefined,
      });
    }
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      errors: filteredErrors,
      filters,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-dashboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bug className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Error Dashboard</h1>
          <p className="text-gray-600">
            Monitor and analyze application errors in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="build">Build</SelectItem>
                  <SelectItem value="runtime">Runtime</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <Select
                value={filters.severity}
                onValueChange={(value) => handleFilterChange("severity", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search errors..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Bug className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Errors
                </p>
                <p className="text-2xl font-bold">{metrics.totalErrors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold">
                  {metrics.trends.errorRate.toFixed(1)}/hr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fix Rate</p>
                <p className="text-2xl font-bold">
                  {(metrics.trends.fixRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg Resolution
                </p>
                <p className="text-2xl font-bold">
                  {metrics.trends.avgResolutionTime}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Errors by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Errors by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Error Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Error Timeline (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.errorsByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ef4444"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Errors and Fix Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {metrics.recentErrors.map((error) => (
                  <div
                    key={error.id}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(error.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                          <Badge variant="outline">{error.category}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(error.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm font-mono break-words">
                          {error.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fix Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {metrics.fixSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {suggestion.title}
                          </h4>
                          <Badge variant="outline">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {suggestion.description}
                        </p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => onFixApplied?.(suggestion.id)}
                        >
                          Apply Fix
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ErrorDashboard;
