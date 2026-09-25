import { Suspense } from "react";
import DiscoverTabs from "@/components/discover/DiscoverTabs";

// Suspense: DiscoverTabs reads ?tab= via useSearchParams.
export default function DiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverTabs />
    </Suspense>
  );
}
