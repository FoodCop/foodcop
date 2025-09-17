import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx'
import '../styles/globals.css'

// Development mode enhancements
if (import.meta.env.DEV) {
  // Enable React DevTools (fixed - check if property exists before setting)
  if (typeof window !== 'undefined' && !window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
    } catch (error) {
      console.log('React DevTools already initialized');
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)