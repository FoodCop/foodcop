# Code Audit Tool

This tool uses Google's Gemini AI to perform a comprehensive code audit of your React/TypeScript codebase.

## Setup

1. Get your Gemini API key from: https://makersuite.google.com/app/apikey

2. Set the environment variable:
   ```powershell
   $env:GEMINI_API_KEY="your-api-key-here"
   ```

## Usage

Run the audit:
```bash
npm run audit
```

## What It Analyzes

The audit checks all files in:
- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/services/` - API and service files
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions

## What It Checks For

1. **Code Quality Issues**
   - Unused imports/variables
   - Complex functions
   - Missing error handling
   - Debug code left in production

2. **React Best Practices**
   - Unnecessary re-renders
   - Missing hook dependencies
   - Prop drilling
   - State management issues

3. **TypeScript Issues**
   - Any types
   - Missing type definitions
   - Unnecessary type assertions

4. **Performance Issues**
   - Heavy computations
   - Large components
   - Inefficient algorithms

5. **Code Duplication**
   - Duplicated logic
   - Code that should be shared
   - Reusability opportunities

6. **Accessibility & UX**
   - Missing ARIA labels
   - Keyboard navigation
   - Loading/error states

## Output

The tool generates a comprehensive report: `CODE_AUDIT_REPORT.md`

The report includes:
- Executive summary with issue counts
- Detailed findings by severity (High/Medium/Low)
- Specific recommendations for each issue
- Summary by category
- Next steps and action items

## Rate Limiting

The script includes a 1-second delay between file analyses to avoid rate limiting.
For large codebases, this may take 10-30 minutes.

## Security Note

- Never commit your API key to git
- The API key is stored only in your environment variable
- `.env` files are already in `.gitignore`
