import { ScoutDebug } from "@/components/debug/ScoutDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { ScoutClient } from "@/components/scout/ScoutClient";

export const metadata = { title: "Scout | FUZO" };

export default function ScoutPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Scout</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Discover nearby restaurants with our interactive map powered by MapLibre GL JS.
        </p>
        
        {/* MapLibre Interactive Map - Using Dynamic Loading Approach */}
        <div className="scout-map-section">
          <ScoutClient
            style={{ width: '100%', height: '500px' }}
            className="border border-gray-200 rounded-lg shadow-sm"
          />
        </div>
        
        {/* Debug Section */}
        <div className="mt-8">
          <ScoutDebug />
        </div>
      </div>
    </main>
  );
}
