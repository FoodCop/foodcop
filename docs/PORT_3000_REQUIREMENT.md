# CRITICAL DEVELOPMENT RULES

## MANDATORY PORT REQUIREMENT
**PORT 3000 ONLY - NO EXCEPTIONS**

- The development server MUST ONLY run on port 3000
- Google OAuth is configured for localhost:3000 redirects
- Any attempt to use port 3001, 3002, or any other port will break authentication
- This is a CRITICAL requirement that cannot be violated

## Server Commands
**ONLY USE THIS COMMAND:**
```powershell
$env:NEXT_TELEMETRY_DISABLED="1"; npm run dev
```

**NEVER USE:**
- `npm run dev -- -p 3001`
- `npm run dev -- --port 3002`  
- Any other port variations

## Authentication Dependencies
- Google OAuth redirect URI: http://localhost:3000/auth/callback
- All authentication flows depend on port 3000
- Changing the port breaks the entire authentication system

## Kill Commands (if needed)
```powershell
taskkill /F /IM node.exe
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
```

---
**REMEMBER: PORT 3000 IS MANDATORY - DO NOT SUGGEST OR USE ANY OTHER PORT**