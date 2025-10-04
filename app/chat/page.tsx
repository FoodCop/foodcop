import { ChatDebug } from "@/components/debug/ChatDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { EnhancedChatInterface } from "@/components/chat/EnhancedChatInterface";

export const metadata = { title: "Chat | FUZO" };

export default function ChatPage() {
  return (
    <main className="container py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">FUZO Chat Hub</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Connect with friends and AI food experts to share culinary discoveries and get personalized recommendations.
        </p>
        
        {/* Enhanced Chat Interface with Friends & AI Support */}
        <div className="mb-8">
          <EnhancedChatInterface />
        </div>
        
        {/* Debug Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <ChatDebug />
        </div>
      </div>
    </main>
  );
}
