// React import removed (not needed with JSX transform)
import { PageRouter } from "./components/PageRouter";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen">
          <PageRouter initialPage="landing" />
          <Toaster />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
