export const dynamic = 'force-dynamic';

import ScoutView from "@/components/scout/ScoutView";
import AppDock from "@/components/nav/AppDock";

export default function ScoutPage() {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, top: 56 }}>
        <ScoutView />
      </div>
      <AppDock />
    </>
  );
}
