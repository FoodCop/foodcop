import { FeedDebug } from "@/components/debug/FeedDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";

export const metadata = { title: "Feed | FUZO" };

export default function FeedPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Feed</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Discover today&apos;s food picks.
        </p>
        <div className="h-96 bg-muted/20 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Feed content coming soon...</p>
        </div>
        <FeedDebug />
      </div>
    </main>
  );
}
