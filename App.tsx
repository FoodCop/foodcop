// React import removed (not needed with JSX transform)
import { PageRouter } from "./components/PageRouter";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen relative">
            <PageRouter initialPage="landing" />
            <Toaster />
          </div>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
