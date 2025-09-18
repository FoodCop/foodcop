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
  CheckCircle,
  Code2,
  FileText,
  RefreshCw,
  Wand2,
  Zap,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { useErrorPatternMatcher } from "./ErrorPatternMatcher";

interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  filePath: string;
  lineNumber?: number;
  confidence: number;
  category:
    | "import"
    | "api"
    | "auth"
    | "error-handling"
    | "config"
    | "build"
    | "other";
  applied: boolean;
  originalCode?: string;
}

interface AutoFixAgentProps {
  errors: Array<{
    message: string;
    stack?: string;
    file?: string;
    line?: number;
  }>;
  onFixApplied?: (fix: FixSuggestion) => void;
  onCodeChange?: (filePath: string, newCode: string) => void;
}

export const AutoFixAgent: React.FC<AutoFixAgentProps> = ({
  errors,
  onFixApplied,
  onCodeChange,
}) => {
  const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { matchError, getSuggestions } = useErrorPatternMatcher();

  const generateFixSuggestions = useCallback(
    async (error: (typeof errors)[0]) => {
      const pattern = matchError(error.message, error.stack);
      if (!pattern) return [];

      const suggestions: FixSuggestion[] = [];
      const patternSuggestions = getSuggestions(pattern);

      // Generate code fixes based on pattern
      patternSuggestions.codeExamples.forEach((example, index) => {
        suggestions.push({
          id: `${pattern.id}-${index}`,
          title: `${pattern.name} - Fix ${index + 1}`,
          description: example.description,
          code: example.after,
          filePath: error.file || "unknown",
          lineNumber: error.line,
          confidence: pattern.confidence,
          category: (pattern.category === "build"
            ? "import"
            : pattern.category) as FixSuggestion["category"],
          applied: false,
          originalCode: example.before,
        });
      });

      // Generate additional context-aware fixes
      if (pattern.category === "api" && error.message.includes("404")) {
        suggestions.push({
          id: `${pattern.id}-api-check`,
          title: "Add API Error Handling",
          description: "Add proper error handling for API calls",
          code: `try {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    }
  });

  if (!response.ok) {
    throw new Error(\`API Error: \${response.status} - \${response.statusText}\`);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API call failed:', error);
  throw error;
}`,
          filePath: error.file || "apiService.ts",
          confidence: 0.8,
          category: "api" as FixSuggestion["category"],
          applied: false,
        });
      }

      if (pattern.category === "auth" && error.message.includes("token")) {
        suggestions.push({
          id: `${pattern.id}-auth-refresh`,
          title: "Add Token Refresh Logic",
          description: "Implement automatic token refresh for expired tokens",
          code: `const refreshToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login
    window.location.href = '/login';
    return null;
  }
};

const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': \`Bearer \${getToken()}\`
    }
  });

  if (response.status === 401) {
    const newSession = await refreshToken();
    if (newSession) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': \`Bearer \${newSession.access_token}\`
        }
      });
    }
  }

  return response;
};`,
          filePath: error.file || "authService.ts",
          confidence: 0.9,
          category: "auth" as FixSuggestion["category"],
          applied: false,
        });
      }

      if (pattern.category === "build" && error.message.includes("import")) {
        suggestions.push({
          id: `${pattern.id}-import-fix`,
          title: "Fix Import Statement",
          description:
            "Correct the import statement with proper path and extension",
          code: `// Check if the file exists and has correct extension
import { Component } from './components/Component.tsx';
// or for default export
import Component from './components/Component';

// Ensure the component is properly exported
export const Component = () => {
  return <div>Component content</div>;
};`,
          filePath: error.file || "component.tsx",
          confidence: 0.85,
          category: "import" as FixSuggestion["category"],
          applied: false,
        });
      }

      return suggestions;
    },
    [matchError, getSuggestions]
  );

  const analyzeErrors = useCallback(async () => {
    setIsAnalyzing(true);
    const allSuggestions: FixSuggestion[] = [];

    for (const error of errors) {
      const errorSuggestions = await generateFixSuggestions(error);
      allSuggestions.push(...errorSuggestions);
    }

    // Sort by confidence and category priority
    allSuggestions.sort((a, b) => {
      const categoryPriority: Record<string, number> = {
        auth: 4,
        api: 3,
        build: 2,
        "error-handling": 1,
        import: 2,
        config: 1,
        other: 0,
      };
      const aPriority = categoryPriority[a.category] || 0;
      const bPriority = categoryPriority[b.category] || 0;

      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.confidence - a.confidence;
    });

    setSuggestions(allSuggestions);
    setIsAnalyzing(false);
  }, [errors, generateFixSuggestions]);

  const applyFix = useCallback(
    (suggestion: FixSuggestion) => {
      setAppliedFixes((prev) => new Set([...prev, suggestion.id]));
      setSuggestions((prev) =>
        prev.map((s) => (s.id === suggestion.id ? { ...s, applied: true } : s))
      );

      if (onFixApplied) {
        onFixApplied(suggestion);
      }

      if (onCodeChange && suggestion.filePath !== "unknown") {
        onCodeChange(suggestion.filePath, suggestion.code);
      }

      // Show success message
      console.log(`✅ Applied fix: ${suggestion.title}`);
    },
    [onFixApplied, onCodeChange]
  );

  const applyAllFixes = useCallback(() => {
    const unappliedSuggestions = suggestions.filter((s) => !s.applied);
    unappliedSuggestions.forEach(applyFix);
  }, [suggestions, applyFix]);

  const resetFixes = useCallback(() => {
    setAppliedFixes(new Set());
    setSuggestions((prev) => prev.map((s) => ({ ...s, applied: false })));
  }, []);

  const getCategoryIcon = (category: FixSuggestion["category"]) => {
    switch (category) {
      case "api":
        return <Zap className="h-4 w-4 text-blue-500" />;
      case "auth":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "build":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "error-handling":
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      case "import":
        return <Code2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Wand2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: FixSuggestion["category"]) => {
    switch (category) {
      case "api":
        return "bg-blue-100 text-blue-800";
      case "auth":
        return "bg-red-100 text-red-800";
      case "build":
        return "bg-green-100 text-green-800";
      case "error-handling":
        return "bg-yellow-100 text-yellow-800";
      case "import":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const appliedCount = appliedFixes.size;
  const totalSuggestions = suggestions.length;

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Auto-Fix Agent
              </CardTitle>
              <CardDescription>
                AI-powered error detection and automatic fix suggestions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={analyzeErrors}
                disabled={isAnalyzing || errors.length === 0}
                size="sm"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Code2 className="h-4 w-4 mr-2" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze Errors"}
              </Button>
              {totalSuggestions > 0 && (
                <>
                  <Button
                    onClick={applyAllFixes}
                    disabled={appliedCount === totalSuggestions}
                    size="sm"
                    variant="default"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Apply All ({totalSuggestions - appliedCount} remaining)
                  </Button>
                  <Button onClick={resetFixes} size="sm" variant="outline">
                    Reset
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No errors detected. The console agent will automatically analyze
                new errors as they appear.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suggestions">
                  Fix Suggestions ({totalSuggestions})
                </TabsTrigger>
                <TabsTrigger value="applied">
                  Applied Fixes ({appliedCount})
                </TabsTrigger>
                <TabsTrigger value="errors">
                  Error Details ({errors.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <Card
                        key={suggestion.id}
                        className={`${suggestion.applied ? "opacity-60" : ""}`}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(suggestion.category)}
                              <CardTitle className="text-sm">
                                {suggestion.title}
                              </CardTitle>
                              <Badge
                                className={getCategoryColor(
                                  suggestion.category
                                )}
                              >
                                {suggestion.category}
                              </Badge>
                              <Badge variant="outline">
                                {Math.round(suggestion.confidence * 100)}%
                                confidence
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => applyFix(suggestion)}
                              disabled={suggestion.applied}
                              variant={
                                suggestion.applied ? "outline" : "default"
                              }
                            >
                              {suggestion.applied ? (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              ) : (
                                <Zap className="h-4 w-4 mr-2" />
                              )}
                              {suggestion.applied ? "Applied" : "Apply Fix"}
                            </Button>
                          </div>
                          <CardDescription>
                            {suggestion.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm mb-2">
                                Suggested Code:
                              </h4>
                              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                {suggestion.code}
                              </pre>
                            </div>
                            {suggestion.originalCode && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">
                                  Original Code:
                                </h4>
                                <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto">
                                  {suggestion.originalCode}
                                </pre>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FileText className="h-3 w-3" />
                              {suggestion.filePath}
                              {suggestion.lineNumber && (
                                <>
                                  <span>•</span>
                                  Line {suggestion.lineNumber}
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="applied" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {suggestions
                      .filter((s) => s.applied)
                      .map((suggestion) => (
                        <Card
                          key={suggestion.id}
                          className="bg-green-50 border-green-200"
                        >
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <CardTitle className="text-sm text-green-800">
                                {suggestion.title}
                              </CardTitle>
                              <Badge className="bg-green-100 text-green-800">
                                Applied
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-green-700">
                              {suggestion.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {errors.map((error, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Error {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-medium text-sm">Message:</h4>
                              <p className="text-sm text-gray-600 font-mono">
                                {error.message}
                              </p>
                            </div>
                            {error.stack && (
                              <div>
                                <h4 className="font-medium text-sm">
                                  Stack Trace:
                                </h4>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {error.stack}
                                </pre>
                              </div>
                            )}
                            {error.file && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <FileText className="h-3 w-3" />
                                {error.file}
                                {error.line && <span>• Line {error.line}</span>}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoFixAgent;
