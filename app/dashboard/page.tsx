"use client";

import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import { AIFoodDashboard } from "@/components/dashboard/AIFoodDashboard";

export default function DashboardPage() {
  return (
    <main className="container py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Food Dashboard</h2>
          <SimpleUserStatus />
        </div>
        
        <p className="text-lg text-muted-foreground">
          Your personalized food insights and AI-powered recommendations.
        </p>
        
        <AIFoodDashboard />
      </div>
    </main>
  );
}
