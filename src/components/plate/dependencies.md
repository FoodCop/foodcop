# Project Dependencies

This document lists all the libraries and packages used in the Plate component application.

## Frontend Dependencies

### Core Framework
- **react** - UI library for building the interface
- **react-dom** - React renderer for web applications

### Styling
- **tailwindcss** (v4.0) - Utility-first CSS framework
- **tailwind-merge** - Utility for merging Tailwind CSS classes
- **clsx** - Utility for constructing className strings conditionally
- **class-variance-authority** - For creating component variants with Tailwind

### UI Components (Shadcn/ui)
The project uses Shadcn/ui components which are built on top of Radix UI primitives:

- **@radix-ui/react-accordion** - Accordion component
- **@radix-ui/react-alert-dialog** - Alert dialog component
- **@radix-ui/react-aspect-ratio** - Aspect ratio container
- **@radix-ui/react-avatar** - Avatar component
- **@radix-ui/react-checkbox** - Checkbox input
- **@radix-ui/react-collapsible** - Collapsible container
- **@radix-ui/react-context-menu** - Context menu component
- **@radix-ui/react-dialog** - Dialog/modal component
- **@radix-ui/react-dropdown-menu** - Dropdown menu
- **@radix-ui/react-hover-card** - Hover card component
- **@radix-ui/react-label** - Label component
- **@radix-ui/react-menubar** - Menubar component
- **@radix-ui/react-navigation-menu** - Navigation menu
- **@radix-ui/react-popover** - Popover component
- **@radix-ui/react-progress** - Progress indicator
- **@radix-ui/react-radio-group** - Radio button group
- **@radix-ui/react-scroll-area** - Custom scroll area
- **@radix-ui/react-select** - Select dropdown
- **@radix-ui/react-separator** - Visual separator
- **@radix-ui/react-slider** - Slider input
- **@radix-ui/react-switch** - Toggle switch
- **@radix-ui/react-tabs** - Tabs component
- **@radix-ui/react-toggle** - Toggle button
- **@radix-ui/react-toggle-group** - Toggle button group
- **@radix-ui/react-tooltip** - Tooltip component
- **@radix-ui/react-slot** - Utility for component composition

### Icons
- **lucide-react** - Icon library (simple, white icons as requested)

### Notifications
- **sonner@2.0.3** - Toast notification library

### Backend/Database
- **@supabase/supabase-js** - Supabase client for database, auth, and storage
- **@supabase/node-fetch** - Fetch implementation for Supabase

### Charts (available but not currently used in Plate)
- **recharts** - Charting library

### Calendar/Date (available but not currently used in Plate)
- **date-fns** - Date utility library
- **react-day-picker** - Calendar/date picker component

### Forms (available but not currently used in Plate)
- **react-hook-form@7.55.0** - Form state management

### Other UI Libraries (available but not currently used in Plate)
- **cmdk** - Command palette component
- **input-otp** - OTP input component
- **react-resizable-panels** - Resizable panel layouts
- **vaul** - Drawer component

## Backend Dependencies (Supabase Edge Functions)

### Server Framework
- **hono** (npm:hono) - Fast web framework for edge runtimes
- **hono/cors** (npm:hono/cors) - CORS middleware for Hono
- **hono/logger** (npm:hono/logger) - Logging middleware

### Database
- **Supabase KV Store** - Key-value storage using the `kv_store_6eeb9061` table
  - Accessed via `/utils/supabase/kv_store.tsx`

### Runtime
- **Deno** - JavaScript/TypeScript runtime for edge functions
  - Uses `npm:` specifier for npm packages
  - Uses `node:` specifier for Node.js built-ins

## Development Tools

### TypeScript
- **typescript** - Type checking and compilation

### Build Tools
- **vite** - Build tool and dev server (assumed, standard for React projects)

## Environment Variables Required

The following environment variables are used (already provided):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend only)
- `SUPABASE_DB_URL` - Supabase database connection URL

## Package Manager

This project uses **npm** or **pnpm** for dependency management.

## Import Patterns

### Standard Imports
```typescript
import { ComponentName } from 'package-name'
```

### Versioned Imports (specific packages only)
```typescript
import { useForm } from 'react-hook-form@7.55.0'
import { toast } from 'sonner@2.0.3'
```

### Backend Imports (Deno Edge Functions)
```typescript
import { Hono } from 'npm:hono'
import process from 'node:process'
```

## Notes

- All Shadcn/ui components are locally installed in `/components/ui`
- Tailwind CSS v4.0 is used (no config file needed, uses CSS-based configuration)
- The project uses ES modules throughout
- TypeScript is used for type safety across all components
- The backend runs on Deno runtime in Supabase Edge Functions

## Recommended Installation Commands

For a fresh setup, install dependencies with:

```bash
npm install react react-dom
npm install tailwindcss tailwind-merge clsx class-variance-authority
npm install lucide-react
npm install sonner@2.0.3
npm install @supabase/supabase-js
npm install react-hook-form@7.55.0
npm install @radix-ui/react-* # (install all needed Radix UI packages)
```

Or simply run:
```bash
npm install
```

if a `package.json` file is present with all dependencies listed.
