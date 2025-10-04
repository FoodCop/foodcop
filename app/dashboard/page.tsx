"use client";

import { DashboardDebug } from "@/components/debug/DashboardDebug";
import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";

export default function DashboardDebugPage() {
  return (
    <main className="container py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Dashboard Debug</h2>
          <SimpleUserStatus />
        </div>
        <DashboardDebug />
      </div>
    </main>
  );
}
