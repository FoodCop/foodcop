import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { ScoutClient } from "@/components/scout/ScoutClient";
import { ScoutDebug } from "@/components/debug/ScoutDebug";
import { ScoutSidebar } from "@/components/scout/ScoutSidebar";

export const metadata = { title: "Scout | FUZO" };

export default function ScoutPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Scout</h1>
          <SimpleUserStatus />
        </div>
        
        {/* MapLibre Interactive Map with Sidebar Overlay */}
        <div className="scout-map-section relative">
          <ScoutClient
            style={{ width: '100%', height: '500px' }}
            className="border border-gray-200 rounded-lg shadow-sm"
          />
          
          {/* ScoutSidebar Overlay */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border shadow-lg rounded-lg max-h-[460px] overflow-y-auto">
            <ScoutSidebar />
          </div>
        </div>

        {/* Debug Section - Commented out for now */}
        {/*
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <ScoutDebug />
        </div>
        */}
      </div>
    </main>
  );
}
