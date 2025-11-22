# Cursor MCP Configuration

This folder contains the MCP (Model Context Protocol) server configuration for Cursor.

## Setup

### 1. Supabase Access Token
- Go to https://supabase.com/dashboard/account/tokens
- Create a new personal access token
- Set environment variable: `SUPABASE_ACCESS_TOKEN`

### 2. Vercel CLI Access
- Install Vercel CLI: `npm i -g vercel`
- Login: `vercel login`
- Get your token from: https://vercel.com/account/tokens
- Set environment variables:
  - `VERCEL_TOKEN` - Your Vercel API token
  - `VERCEL_ORG_ID` - Your organization ID (optional, can be found in Vercel dashboard)
  - `VERCEL_PROJECT_ID` - Your project ID (optional, can be found in project settings)

### 3. Google Cloud SDK
- Already set up on your system
- Ensure environment variables are set:
  - `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON (if using service account)
  - `GCLOUD_PROJECT` - Your GCP project ID
- Or use `gcloud auth application-default login` for user credentials

### 4. Figma Access Token (optional)
- Go to https://www.figma.com/developers/api#access-tokens
- Create a new personal access token
- Set environment variable: `FIGMA_ACCESS_TOKEN`

### 5. Set Environment Variables

**Windows (PowerShell)**:
```powershell
[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "your_token", "User")
[System.Environment]::SetEnvironmentVariable("VERCEL_TOKEN", "your_token", "User")
[System.Environment]::SetEnvironmentVariable("GCLOUD_PROJECT", "your_project_id", "User")
```

**Or set in your shell profile** (`.bashrc`, `.zshrc`, etc.):
```bash
export SUPABASE_ACCESS_TOKEN=your_token
export VERCEL_TOKEN=your_token
export GCLOUD_PROJECT=your_project_id
```

### 6. Restart Cursor
- Close and reopen Cursor for the MCP servers to initialize

## Configured Servers

### Supabase
- **Project Reference**: `lgladnskxmbkhcnrsfxv`
- **Purpose**: Access Supabase database, auth, storage, and edge functions
- **Token Required**: `SUPABASE_ACCESS_TOKEN`

### Vercel
- **Purpose**: Deploy, manage, and monitor Vercel projects
- **Token Required**: `VERCEL_TOKEN`
- **Optional**: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Google Cloud
- **Purpose**: Access GCP services, manage resources
- **Setup**: Uses `gcloud` CLI (already configured)
- **Environment Variables**: `GOOGLE_APPLICATION_CREDENTIALS`, `GCLOUD_PROJECT`

### Figma
- **Purpose**: Access Figma designs and components
- **Token Required**: `FIGMA_ACCESS_TOKEN`

### SonarQube
- **Organization**: `foodcop`
- **Purpose**: Code quality analysis
- **Token**: Already configured

## Usage

Once configured, you can use MCP tools in Cursor to:
- **Supabase**: Query database, manage auth, storage, edge functions
- **Vercel**: Deploy projects, manage environments, view logs
- **GCloud**: Manage GCP resources, access services
- **Figma**: Access designs and components
- **SonarQube**: Run code quality checks

## Troubleshooting

If MCP servers don't start:
1. Verify environment variables are set: `echo $SUPABASE_ACCESS_TOKEN` (or `$env:SUPABASE_ACCESS_TOKEN` in PowerShell)
2. Check Node.js/npx is available: `npx --version`
3. Verify Vercel CLI: `vercel --version`
4. Verify GCloud CLI: `gcloud --version`
5. Check Cursor's MCP server logs
6. Restart Cursor after setting environment variables

