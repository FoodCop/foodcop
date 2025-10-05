import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { BitesDebug } from "@/components/debug/BitesDebug";

export const metadata = { title: "Bites | FUZO" };

export default function BitesPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bites</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Watch short food videos and discover new dishes.
        </p>
        <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Video content coming soon...</p>
        </div>

        {/* Debug Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <BitesDebug />
        </div>
      </div>
    </main>
  );
}
