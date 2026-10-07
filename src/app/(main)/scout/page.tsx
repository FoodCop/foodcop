export const dynamic = 'force-dynamic';

import ScoutView from "@/components/scout/ScoutView";
import AppDock from "@/components/nav/AppDock";

export default function ScoutPage() {
  return (
    <>
      {/* The map fills the screen and runs behind the floating navbar. */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <ScoutView />
      </div>
      <AppDock />
    </>
  );
}
