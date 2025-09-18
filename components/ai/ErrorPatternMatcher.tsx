import { Bug, FileText, Network, Shield, Wrench, Zap } from "lucide-react";
import React, { useMemo } from "react";

// Database icon component (since it's not in lucide-react)
const Database: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
  </svg>
);

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  patterns: RegExp[];
  category:
    | "api"
    | "ui"
    | "network"
    | "auth"
    | "build"
    | "runtime"
    | "database"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  icon: React.ReactNode;
  suggestedFixes: string[];
  codeExamples: {
    before: string;
    after: string;
    description: string;
  }[];
  relatedFiles: string[];
  confidence: number;
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: "api-404",
    name: "API Endpoint Not Found",
    description:
      "The requested API endpoint does not exist or is not accessible",
    patterns: [
      /404.*not found/i,
      /endpoint.*not found/i,
      /api.*404/i,
      /resource.*not found/i,
    ],
    category: "api",
    severity: "high",
    icon: <Network className="h-4 w-4" />,
    suggestedFixes: [
      "Verify the API endpoint URL is correct",
      "Check if the backend service is running",
      "Ensure the API route is properly configured",
      "Check for typos in the endpoint path",
    ],
    codeExamples: [
      {
        before: `fetch('/api/users/123')`,
        after: `fetch('/api/v1/users/123', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${token}\`
  }
})`,
        description: "Add proper headers and version to API calls",
      },
    ],
    relatedFiles: ["apiConfig.ts", "backendService.ts"],
    confidence: 0.9,
  },
  {
    id: "auth-token-expired",
    name: "Authentication Token Expired",
    description:
      "The user authentication token has expired and needs to be refreshed",
    patterns: [
      /token.*expired/i,
      /unauthorized/i,
      /401.*unauthorized/i,
      /jwt.*expired/i,
      /authentication.*failed/i,
    ],
    category: "auth",
    severity: "high",
    icon: <Shield className="h-4 w-4" />,
    suggestedFixes: [
      "Implement token refresh mechanism",
      "Add automatic re-authentication",
      "Check token expiration before API calls",
      "Redirect to login page if refresh fails",
    ],
    codeExamples: [
      {
        before: `const response = await fetch('/api/protected', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});`,
        after: `const response = await fetch('/api/protected', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});

if (response.status === 401) {
  const refreshed = await refreshToken();
  if (refreshed) {
    return fetch('/api/protected', {
      headers: { 'Authorization': \`Bearer \${newToken}\` }
    });
  } else {
    redirectToLogin();
  }
}`,
        description: "Add token refresh logic for 401 responses",
      },
    ],
    relatedFiles: ["AuthContext.tsx", "authService.ts"],
    confidence: 0.95,
  },
  {
    id: "cors-error",
    name: "CORS Policy Violation",
    description: "Cross-Origin Resource Sharing policy is blocking the request",
    patterns: [
      /cors/i,
      /cross-origin/i,
      /access.*control.*allow.*origin/i,
      /preflight/i,
    ],
    category: "network",
    severity: "medium",
    icon: <Network className="h-4 w-4" />,
    suggestedFixes: [
      "Configure CORS headers on the server",
      "Add proper preflight handling",
      "Check allowed origins configuration",
      "Use proxy for development",
    ],
    codeExamples: [
      {
        before: `fetch('https://api.example.com/data')`,
        after: `// In vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});`,
        description: "Use Vite proxy to handle CORS in development",
      },
    ],
    relatedFiles: ["vite.config.ts", "server configuration"],
    confidence: 0.85,
  },
  {
    id: "module-not-found",
    name: "Module Import Error",
    description: "A required module or file cannot be found during import",
    patterns: [
      /module.*not found/i,
      /cannot resolve module/i,
      /import.*error/i,
      /file.*not found/i,
    ],
    category: "build",
    severity: "critical",
    icon: <FileText className="h-4 w-4" />,
    suggestedFixes: [
      "Check the import path for typos",
      "Verify the file exists at the specified location",
      "Ensure the module is properly exported",
      "Check if the package is installed",
    ],
    codeExamples: [
      {
        before: `import { Component } from './components/Component';`,
        after: `import { Component } from './components/Component.tsx';
// or
import Component from './components/Component';`,
        description: "Fix import path and ensure file extension is correct",
      },
    ],
    relatedFiles: ["package.json", "tsconfig.json"],
    confidence: 0.9,
  },
  {
    id: "undefined-property",
    name: "Undefined Property Access",
    description:
      "Attempting to access a property on an undefined or null object",
    patterns: [
      /cannot read.*property/i,
      /undefined.*is not a function/i,
      /null.*reference/i,
      /TypeError.*undefined/i,
    ],
    category: "runtime",
    severity: "high",
    icon: <Bug className="h-4 w-4" />,
    suggestedFixes: [
      "Add null/undefined checks before property access",
      "Use optional chaining operator (?.)",
      "Provide default values for potentially undefined objects",
      "Implement proper error boundaries",
    ],
    codeExamples: [
      {
        before: `const name = user.profile.name;`,
        after: `const name = user?.profile?.name || 'Unknown';
// or
if (user && user.profile && user.profile.name) {
  const name = user.profile.name;
}`,
        description: "Use optional chaining or null checks to prevent errors",
      },
    ],
    relatedFiles: ["ErrorBoundary.tsx", "component files"],
    confidence: 0.8,
  },
  {
    id: "environment-variable",
    name: "Missing Environment Variable",
    description: "A required environment variable is not defined or accessible",
    patterns: [
      /environment.*variable/i,
      /env.*not found/i,
      /process\.env/i,
      /import\.meta\.env/i,
      /undefined.*env/i,
    ],
    category: "build",
    severity: "high",
    icon: <Wrench className="h-4 w-4" />,
    suggestedFixes: [
      "Add the missing environment variable to .env file",
      "Check environment variable naming convention",
      "Ensure variables are prefixed with VITE_ for client-side access",
      "Verify .env file is in the correct location",
    ],
    codeExamples: [
      {
        before: `const apiKey = process.env.API_KEY;`,
        after: `// In .env file
VITE_API_KEY=your_api_key_here

// In code
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error('VITE_API_KEY is required');
}`,
        description: "Use VITE_ prefix for client-side environment variables",
      },
    ],
    relatedFiles: [".env", ".env.example", "vite.config.ts"],
    confidence: 0.95,
  },
  {
    id: "async-await-error",
    name: "Async/Await Error Handling",
    description: "Unhandled promise rejection or improper async error handling",
    patterns: [
      /unhandled.*rejection/i,
      /promise.*rejected/i,
      /async.*error/i,
      /await.*error/i,
    ],
    category: "runtime",
    severity: "medium",
    icon: <Zap className="h-4 w-4" />,
    suggestedFixes: [
      "Add try-catch blocks around async operations",
      "Handle promise rejections properly",
      "Use Promise.allSettled for multiple async operations",
      "Implement proper error logging",
    ],
    codeExamples: [
      {
        before: `const data = await fetchData();`,
        after: `try {
  const data = await fetchData();
  // Handle success
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Handle error appropriately
}`,
        description: "Wrap async operations in try-catch blocks",
      },
    ],
    relatedFiles: ["async components", "service files"],
    confidence: 0.85,
  },
  {
    id: "database-connection",
    name: "Database Connection Error",
    description:
      "Unable to connect to the database or perform database operations",
    patterns: [
      /database.*connection/i,
      /supabase.*error/i,
      /postgres.*error/i,
      /connection.*refused/i,
      /database.*unavailable/i,
    ],
    category: "database",
    severity: "critical",
    icon: <Database className="h-4 w-4" />,
    suggestedFixes: [
      "Check database connection string",
      "Verify database server is running",
      "Check network connectivity to database",
      "Verify authentication credentials",
    ],
    codeExamples: [
      {
        before: `const { data, error } = await supabase.from('table').select();`,
        after: `const { data, error } = await supabase.from('table').select();

if (error) {
  console.error('Database error:', error);
  // Handle error appropriately
  return;
}

// Process data
console.log('Data:', data);`,
        description: "Add proper error handling for database operations",
      },
    ],
    relatedFiles: ["supabase config", "database service files"],
    confidence: 0.9,
  },
];

export const useErrorPatternMatcher = () => {
  const matchError = useMemo(() => {
    return (message: string, stack?: string): ErrorPattern | null => {
      const fullText = `${message} ${stack || ""}`.toLowerCase();

      for (const pattern of ERROR_PATTERNS) {
        if (pattern.patterns.some((p) => p.test(fullText))) {
          return pattern;
        }
      }

      return null;
    };
  }, []);

  const getSuggestions = useMemo(() => {
    return (pattern: ErrorPattern) => {
      return {
        fixes: pattern.suggestedFixes,
        codeExamples: pattern.codeExamples,
        relatedFiles: pattern.relatedFiles,
        confidence: pattern.confidence,
      };
    };
  }, []);

  const categorizeError = useMemo(() => {
    return (
      message: string
    ): {
      category: ErrorPattern["category"];
      severity: ErrorPattern["severity"];
    } => {
      const matchedPattern = matchError(message);
      if (matchedPattern) {
        return {
          category: matchedPattern.category,
          severity: matchedPattern.severity,
        };
      }

      // Default categorization based on keywords
      if (message.includes("api") || message.includes("fetch")) {
        return { category: "api", severity: "medium" };
      }
      if (message.includes("auth") || message.includes("token")) {
        return { category: "auth", severity: "high" };
      }
      if (message.includes("import") || message.includes("module")) {
        return { category: "build", severity: "critical" };
      }

      return { category: "other", severity: "low" };
    };
  }, [matchError]);

  return {
    matchError,
    getSuggestions,
    categorizeError,
    patterns: ERROR_PATTERNS,
  };
};

export default useErrorPatternMatcher;
