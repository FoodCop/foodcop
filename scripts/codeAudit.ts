import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import glob from 'fast-glob';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config();

interface AuditResult {
  file: string;
  category: string;
  findings: string[];
  recommendations: string[];
  severity: 'high' | 'medium' | 'low';
}

const AUDIT_CATEGORIES = {
  pages: 'src/pages/**/*.{tsx,ts}',
  components: 'src/components/**/*.{tsx,ts}',
  services: 'src/services/**/*.{tsx,ts}',
  hooks: 'src/hooks/**/*.{tsx,ts}',
  utils: 'src/utils/**/*.{tsx,ts}',
};

class CodeAuditor {
  private openai: OpenAI;
  private results: AuditResult[] = [];

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeFile(filePath: string, category: string): Promise<AuditResult> {
    console.log(`🔍 Analyzing: ${filePath}`);

    try {
      const content = await readFile(filePath, 'utf-8');
      
      const prompt = `You are a senior React/TypeScript code reviewer conducting an AAA-quality code audit. Analyze this ${category} file with the highest standards:

1. **Code Quality & Best Practices**
   - Unused imports or variables
   - Complex functions that should be broken down (functions > 50 lines)
   - Missing error handling and edge cases
   - Console.logs or debug code left in production
   - Code smells and anti-patterns
   - Naming conventions and readability
   - Documentation and comments quality

2. **React Best Practices (AAA Standards)**
   - Unnecessary re-renders and performance issues
   - Missing dependencies in useEffect/useMemo/useCallback
   - Prop drilling issues (should use Context/Zustand)
   - State management problems
   - Component composition and separation of concerns
   - Custom hooks usage and extraction opportunities
   - Keys in lists properly implemented

3. **TypeScript Excellence**
   - Any 'any' types that should be specific
   - Missing type definitions
   - Type assertions that could be avoided
   - Proper interface/type usage
   - Generic types where appropriate
   - Discriminated unions for better type safety

4. **Performance & Optimization**
   - Heavy computations that should be memoized
   - Large components that should be split
   - Inefficient data structures or algorithms
   - Bundle size concerns
   - Lazy loading opportunities
   - Virtual scrolling for large lists

5. **Code Duplication & Reusability (CRITICAL)**
   - Code that appears to be duplicated elsewhere
   - Logic that should be extracted to shared utilities
   - Components that could be made more reusable
   - Similar patterns across files that should be unified
   - Opportunities to create shared hooks or utilities
   - API calls that should be centralized

6. **Accessibility & UX (AAA Standards)**
   - Missing ARIA labels and roles
   - Keyboard navigation issues
   - Focus management
   - Screen reader support
   - Color contrast and visual accessibility
   - Missing loading/error states
   - User feedback mechanisms

7. **Security & Data Handling**
   - Input validation
   - XSS vulnerabilities
   - Secure data handling
   - API key exposure
   - Sensitive data in client-side code

8. **Testing & Maintainability**
   - Testability of the code
   - Missing test cases
   - Code complexity (cyclomatic complexity)
   - Maintainability score

File: ${filePath}

\`\`\`typescript
${content.slice(0, 15000)} // Truncated if too long
\`\`\`

Provide a structured analysis in this exact JSON format:
{
  "findings": ["List of specific issues found with line numbers if possible"],
  "recommendations": ["Specific actionable recommendations with code examples if helpful"],
  "severity": "high" | "medium" | "low"
}

Be thorough and critical. This is for AAA-quality production code. Focus on actionable items.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Using mini for cost efficiency and rate limits
        messages: [
          {
            role: "system",
            content: "You are an expert code reviewer. Always respond with valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content || '{}';
      
      let analysis;
      try {
        analysis = JSON.parse(responseText);
      } catch (e) {
        analysis = {
          findings: [responseText],
          recommendations: ['Review the analysis manually'],
          severity: 'medium'
        };
      }

      return {
        file: filePath,
        category,
        findings: analysis.findings || [],
        recommendations: analysis.recommendations || [],
        severity: analysis.severity || 'medium'
      };
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error);
      return {
        file: filePath,
        category,
        findings: [`Error during analysis: ${error}`],
        recommendations: ['Manual review needed'],
        severity: 'low'
      };
    }
  }

  async auditCategory(category: string, pattern: string): Promise<void> {
    console.log(`\n📂 Auditing ${category}...`);
    
    const files = await glob(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}']
    });

    console.log(`Found ${files.length} files in ${category}\n`);

    for (const file of files) {
      const result = await this.analyzeFile(file, category);
      this.results.push(result);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async generateReport(): Promise<void> {
    const reportPath = join(process.cwd(), 'CODE_AUDIT_REPORT.md');
    
    const highSeverity = this.results.filter(r => r.severity === 'high');
    const mediumSeverity = this.results.filter(r => r.severity === 'medium');
    const lowSeverity = this.results.filter(r => r.severity === 'low');

    const report = `# Code Audit Report
**Generated:** ${new Date().toISOString()}
**Total Files Analyzed:** ${this.results.length}

## Executive Summary

- 🔴 **High Priority Issues:** ${highSeverity.length}
- 🟡 **Medium Priority Issues:** ${mediumSeverity.length}
- 🟢 **Low Priority Issues:** ${lowSeverity.length}

---

## High Priority Issues

${highSeverity.length > 0 ? highSeverity.map(r => `
### ${r.file.replace(process.cwd(), '')}
**Category:** ${r.category}

#### Findings:
${r.findings.map(f => `- ${f}`).join('\n')}

#### Recommendations:
${r.recommendations.map(rec => `- ${rec}`).join('\n')}

---
`).join('\n') : '*No high priority issues found*'}

## Medium Priority Issues

${mediumSeverity.length > 0 ? mediumSeverity.map(r => `
### ${r.file.replace(process.cwd(), '')}
**Category:** ${r.category}

#### Findings:
${r.findings.map(f => `- ${f}`).join('\n')}

#### Recommendations:
${r.recommendations.map(rec => `- ${rec}`).join('\n')}

---
`).join('\n') : '*No medium priority issues found*'}

## Low Priority Issues

${lowSeverity.length > 0 ? lowSeverity.map(r => `
### ${r.file.replace(process.cwd(), '')}
**Category:** ${r.category}

#### Findings:
${r.findings.map(f => `- ${f}`).join('\n')}

#### Recommendations:
${r.recommendations.map(rec => `- ${rec}`).join('\n')}

---
`).join('\n') : '*No low priority issues found*'}

## Summary by Category

${Object.keys(AUDIT_CATEGORIES).map(cat => {
  const categoryResults = this.results.filter(r => r.category === cat);
  return `
### ${cat.charAt(0).toUpperCase() + cat.slice(1)}
- Files Analyzed: ${categoryResults.length}
- High Priority: ${categoryResults.filter(r => r.severity === 'high').length}
- Medium Priority: ${categoryResults.filter(r => r.severity === 'medium').length}
- Low Priority: ${categoryResults.filter(r => r.severity === 'low').length}
`;
}).join('\n')}

---

## Next Steps

1. Address all high priority issues first
2. Review medium priority issues and plan fixes
3. Consider low priority issues for future improvements
4. Set up automated linting/testing to prevent similar issues

*This report was generated by AI analysis and should be reviewed by a human developer.*
`;

    await writeFile(reportPath, report, 'utf-8');
    console.log(`\n✅ Report saved to: ${reportPath}`);
  }

  async runFullAudit(): Promise<void> {
    console.log('🚀 Starting comprehensive code audit...\n');
    console.log('This may take several minutes depending on your codebase size.\n');

    for (const [category, pattern] of Object.entries(AUDIT_CATEGORIES)) {
      await this.auditCategory(category, pattern);
    }

    await this.generateReport();

    console.log('\n✨ Audit complete!');
    console.log(`📊 Analyzed ${this.results.length} files`);
    console.log(`🔴 High priority: ${this.results.filter(r => r.severity === 'high').length}`);
    console.log(`🟡 Medium priority: ${this.results.filter(r => r.severity === 'medium').length}`);
    console.log(`🟢 Low priority: ${this.results.filter(r => r.severity === 'low').length}`);
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is required');
    console.error('Set it with: $env:OPENAI_API_KEY="your-api-key"');
    process.exit(1);
  }

  const auditor = new CodeAuditor(apiKey);
  await auditor.runFullAudit();
}

main();
