import { Camera, ChefHat, Home, Map } from "lucide-react";

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
  const tabs = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "scout", label: "Scout", icon: Map },
    { id: "snap", label: "Snap", icon: Camera, isCenter: true },
    { id: "bites", label: "Bites", icon: ChefHat },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-1.5 z-50">
      <div className="flex justify-around items-end max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          const isCenter = tab.id === "snap";

          if (isCenter) {
            // Special center button for camera
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center p-1 transition-all duration-200 -mt-1"
              >
                <div
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    isActive
                      ? "bg-[#A6471E] scale-105"
                      : "bg-[#F14C35] hover:bg-[#A6471E] hover:scale-105"
                  }`}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium mt-0.5 text-[#F14C35]">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? "bg-[#F14C35]/10 text-[#F14C35]"
                  : "text-gray-500 hover:text-[#0B1F3A] hover:bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-xl relative ${
                  isActive ? "bg-[#F14C35]" : ""
                }`}
              >
                <IconComponent
                  className={`w-5 h-5 ${isActive ? "text-white" : "inherit"}`}
                  fill={isActive ? "currentColor" : "none"}
                />
              </div>
              <span className="text-xs font-medium mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
