import React from 'react'
import { LandingPage } from './components/LandingPage'
import { Toaster } from './components/ui/sonner'

export default function App() {
  return (
    <div className="min-h-screen">
      <LandingPage />
      <Toaster />
    </div>
  )
}
