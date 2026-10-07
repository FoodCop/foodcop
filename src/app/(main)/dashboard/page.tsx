import { Suspense } from 'react';
import DashboardView from '@/components/dashboard/DashboardView';

// Suspense: DashboardView reads the active tab from ?tab= via useSearchParams.
export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardView />
    </Suspense>
  );
}
