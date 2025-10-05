import { AIDebug } from "@/components/debug/AIDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { FoodAssistant } from "@/components/ai/FoodAssistant";

export const metadata = { title: "AI Assistant | FUZO" };

export default function AIPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">AI Food Assistant</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Get personalized food recommendations, recipe suggestions, and culinary advice from our AI assistant.
        </p>
        
        {/* AI Food Assistant Interface */}
        <div className="mb-8">
          <FoodAssistant />
        </div>
        
        {/* Debug Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <AIDebug />
        </div>
      </div>
    </main>
  );
}
