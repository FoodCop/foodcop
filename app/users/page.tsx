import { Users } from "@/components/debug/Users";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";

export const metadata = { title: "Users | FUZO" };

export default function UsersPage() {
  return (
    <main className="container py-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users Debug</h1>
          <SimpleUserStatus />
        </div>
        <p className="text-lg text-muted-foreground">
          User management and debugging interface.
        </p>
        <Users />
      </div>
    </main>
  );
}