import { AuthProvider } from "@/components/auth/AuthProvider";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { HydrationErrorBoundary } from "@/components/HydrationErrorBoundary";
import NoSSR from "@/components/NoSSR";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = { title: "FUZO", description: "Food discovery" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <HydrationErrorBoundary>
          <NoSSR fallback={<div className="min-h-screen bg-background text-foreground">Loading...</div>}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <AuthProvider>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </NoSSR>
        </HydrationErrorBoundary>
      </body>
    </html>
  );
}
