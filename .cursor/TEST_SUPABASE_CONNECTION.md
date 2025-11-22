# Testing Supabase MCP Connection

## Current Configuration

- **Project Reference**: `lgladnskxmbkhcnrsfxv`
- **MCP Server**: `@supabase/mcp-server-supabase@latest`
- **Environment Variable**: `SUPABASE_ACCESS_TOKEN`

## Steps to Test Connection

1. **Verify Environment Variable is Set**:
   ```powershell
   # In PowerShell
   $env:SUPABASE_ACCESS_TOKEN
   ```
   Should return your token (not empty)

2. **Restart Cursor**:
   - Close Cursor completely
   - Reopen Cursor
   - Wait a few seconds for MCP servers to initialize

3. **Check MCP Server Status**:
   - Look for MCP server status in Cursor's status bar
   - Check Cursor's MCP logs (usually in Output panel)

4. **Test Connection**:
   Once connected, you should be able to:
   - Query your Supabase database
   - View tables and schemas
   - Execute SQL queries
   - Manage edge functions
   - Access storage buckets

## Expected Database Tables

Based on your migrations, you should have:
- `user_swipe_history` - Tracks user swipe interactions
- `masterbot_posts` - Social feed content
- `saved_items` - User's saved content (plate items)
- `users` - User profiles with preferences

## Troubleshooting

If connection fails:
1. Verify token is valid at https://supabase.com/dashboard/account/tokens
2. Check token has proper permissions
3. Verify project ref `lgladnskxmbkhcnrsfxv` is correct
4. Check Cursor's MCP server logs for errors
5. Try setting the token directly in the config file temporarily to test



