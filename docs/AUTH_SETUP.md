# Authentication Setup Guide

## Supabase Configuration

To enable Google OAuth authentication, you need to configure your Supabase project:

### 1. Supabase Dashboard Setup

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Set **Redirect URLs**:
   - Add: `http://localhost:3000/auth/callback` (for development)
   - Add: `https://yourdomain.com/auth/callback` (for production)

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set **Application type** to "Web application"
6. Add **Authorized redirect URIs**:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret** to Supabase

### 3. Environment Variables

Update your `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (configured in Supabase, not needed in env)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Testing Authentication

1. Start the development server: `npm run dev:next`
2. Visit `http://localhost:3000`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. You should be redirected back and see your profile information

### 5. Protected Routes

The following routes require authentication:

- `/feed` - Food discovery feed
- `/bites` - Video content
- `/scout` - Map and routes
- `/snap` - Camera capture
- `/profile` - User profile
- `/chat-debug` - Chat debugging

### 6. Troubleshooting

**Common Issues:**

1. **"Invalid redirect URI" error**: Make sure the redirect URI in Google Cloud Console matches exactly: `https://your-project-ref.supabase.co/auth/v1/callback`

2. **"OAuth client not found"**: Verify your Google Client ID and Secret are correct in Supabase

3. **"Domain not authorized"**: Add your domain to Google Cloud Console authorized domains

4. **Authentication not persisting**: Check that cookies are working and middleware is properly configured

**Debug Steps:**

1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify environment variables are loaded
4. Test with a fresh browser session

### 7. Production Deployment

For production deployment:

1. Update Google Cloud Console with production domain
2. Update Supabase redirect URLs with production domain
3. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Test the complete authentication flow in production

## Current Status

✅ **Completed:**

- Supabase SSR client setup
- Google OAuth integration
- Authentication context and components
- Protected route middleware
- User profile display
- Login/logout functionality

🔄 **In Progress:**

- Testing authentication flow

📋 **Next Steps:**

- Configure Google OAuth in Supabase dashboard
- Test complete authentication flow
- Add error handling and loading states
