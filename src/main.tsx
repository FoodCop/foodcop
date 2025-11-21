import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Environment variable check for deployment debugging
const checkEnvVars = () => {
  const requiredVars = {
    'VITE_GOOGLE_MAPS_API_KEY': import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    // YouTube API key stored server-side in Supabase Edge Function
    'VITE_SPOONACULAR_API_KEY': import.meta.env.VITE_SPOONACULAR_API_KEY,
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing.join(', '));
    console.warn('📝 Add these in Vercel Dashboard → Settings → Environment Variables');
  } else {
    console.log('✅ All required environment variables are configured');
  }
};

checkEnvVars();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
