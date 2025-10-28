<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# FuzoFoodCop Project Instructions

This is a complex food application built with Vite + React + TypeScript that integrates with multiple APIs and services.

## Project Overview
- **Tech Stack**: Vite, React, TypeScript, Supabase, Vercel
- **APIs**: Google Places, OpenAI, Spoonacular, YouTube
- **Auth**: Google OAuth via Supabase
- **Design**: Figma components via MCP
- **Database**: Supabase

## Development Guidelines
- Use TypeScript for all new files
- Follow React best practices with hooks
- Implement proper error handling for all API calls
- Use environment variables for all API keys
- Maintain responsive design patterns
- Follow component-based architecture

## Folder Structure
- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/services` - API integration services
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/src/config` - Configuration files

## API Integration Notes
- All API calls should be properly typed
- Implement rate limiting and error retry logic
- Use React Query for data fetching and caching
- Store sensitive keys in environment variables only