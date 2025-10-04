import { SimpleUserStatus } from "@/components/auth/SimpleUserStatus";
import ScoutPageNew from "@/components/ScoutPageNew";

export const metadata = { title: "Scout | FUZO - Restaurant Discovery" };

export default function ScoutPage() {
  return (
    <div className="scout-page-wrapper">
      {/* Header - only visible on desktop */}
      <header className="scout-header">
        <div className="header-content">
          <h1 className="header-title">Scout</h1>
          <p className="header-subtitle">
            Discover restaurants near you with tap-to-route functionality
          </p>
          <SimpleUserStatus />
        </div>
      </header>

      {/* Main Scout Interface */}
      <div className="scout-main">
        <ScoutPageNew />
      </div>
    </div>
  );
}