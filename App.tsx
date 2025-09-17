// React import removed (not needed with JSX transform)
import { PageRouter } from './components/PageRouter'
import { Toaster } from './components/ui/sonner'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  // AuthProvider removed during auth reset. Components now rely on stub context returning null user.
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <PageRouter initialPage="landing" />
        <Toaster />
      </div>
    </ErrorBoundary>
  )
}