import React from 'react';
import { LandingPage } from './features/landing/components/LandingView';

const CORE_APP_URL = 'https://app.fuzo.app';

function App() {
  const handleStart = () => {
    window.location.href = CORE_APP_URL;
  };

  return <LandingPage onStart={handleStart} />;
}

export default App;
