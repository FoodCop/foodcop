import { PlateDebug } from "@/components/debug/PlateDebug";
import { PlatePageComponent } from "@/components/plate/PlatePageComponent";

export const metadata = { title: "Plate | FUZO" };

export default function PlatePage() {
  return (
    <main>
      {/* New Rich Plate Interface */}
      <PlatePageComponent />
      
      {/* Debug Section - Will be hidden in production */}
      <div className="mt-12 pt-8 border-t-2 border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            🔧 Debug Information (Development Only)
          </h2>
          <PlateDebug />
        </div>
      </div>
    </main>
  );
}
