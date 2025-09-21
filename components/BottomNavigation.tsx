import { Camera, ChefHat, Home, Map, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToScout?: () => void;
  onNavigateToSnap?: () => void;
}

export function BottomNavigation({
  activeTab,
  onTabChange,
  onNavigateToFeed,
  onNavigateToScout,
  onNavigateToSnap,
}: BottomNavigationProps) {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sub actions exposed by the FAB
  const actions = [
    {
      id: "feed",
      label: "Feed",
      icon: Home,
      onClick: () => {
        onNavigateToFeed ? onNavigateToFeed() : onTabChange("feed");
      },
      // position when expanded (relative to FAB)
      className: "-translate-y-20 -translate-x-24", // up-left
    },
    {
      id: "scout",
      label: "Scout",
      icon: Map,
      onClick: () => {
        onNavigateToScout ? onNavigateToScout() : onTabChange("scout");
      },
      className: "-translate-y-20 -translate-x-8", // up-left-center
    },
    {
      id: "snap",
      label: "Snap",
      icon: Camera,
      onClick: () => {
        onNavigateToSnap ? onNavigateToSnap() : onTabChange("snap");
      },
      className: "-translate-y-20 translate-x-8", // up-right-center
    },
    {
      id: "bites",
      label: "Bites",
      icon: ChefHat,
      onClick: () => onTabChange("bites"),
      className: "-translate-y-20 translate-x-24", // up-right
    },
  ];

  return (
    <>
      {/* Backdrop (click to close) */}
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        role="navigation"
        aria-label="Bottom navigation"
      >
        {/* Bar */}
        <div className="mx-auto max-w-md px-4 pb-4">
          <div className="relative flex items-end justify-center">
            {/* Floating Action Button + sub buttons container */}
            <div className="relative">
              {/* Sub buttons */}
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      a.onClick();
                      setOpen(false);
                    }}
                    aria-label={a.label}
                    className={[
                      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                      "rounded-full shadow-lg bg-white border border-gray-200",
                      "p-3 focus:outline-none focus:ring-2 focus:ring-[#F14C35]",
                      "transition-all duration-300 ease-out",
                      open
                        ? `opacity-100 scale-100 ${a.className}`
                        : "opacity-0 scale-75 pointer-events-none",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5 text-[#0B1F3A]" />
                  </button>
                );
              })}

              {/* Main FAB */}
              <button
                onClick={() => {
                  setOpen((s) => !s);
                }}
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={open ? "Close menu" : "Open menu"}
                className={[
                  "relative z-50 flex h-14 w-14 items-center justify-center rounded-full",
                  "bg-[#F14C35] text-white shadow-xl transition-all duration-300",
                  open ? "scale-105 rotate-90" : "hover:scale-105",
                ].join(" ")}
              >
                {open ? (
                  <X className="h-6 w-6" />
                ) : (
                  <img
                    src="/images/landing/Images/fav_logo.png"
                    alt="Fuzo"
                    className="h-8 w-8 object-contain"
                  />
                )}
              </button>
            </div>
          </div>

          {/* Bottom safe area spacer */}
          <div className="h-4" />
        </div>
      </nav>
    </>
  );
}
