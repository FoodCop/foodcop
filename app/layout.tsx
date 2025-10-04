import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/Footer";
import NavBar from "@/components/NavBar";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata = { title: "FUZO", description: "Food discovery" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <NavBar />
            <div className="min-h-[60vh]">{children}</div>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
