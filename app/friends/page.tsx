import { Friends } from "@/components/debug/Friends";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";

export const metadata = { title: "Friends | FUZO" };

export default function FriendsPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Friends & Notifications</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          Manage your friend connections and notifications.
        </p>
        <Friends />
      </div>
    </main>
  );
}