import { AIDebug } from "@/components/debug/AIDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";

export const metadata = { title: "AI | FUZO" };

export default function AIPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Ask the foodie AI anything.
        </p>
        <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">
            AI chat interface coming soon...
          </p>
        </div>
        <AIDebug />
      </div>
    </main>
  );
}
