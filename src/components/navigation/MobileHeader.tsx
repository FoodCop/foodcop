import { ArrowLeft, Search, Bell, Settings, MoreVertical } from 'lucide-react';

export interface MobileHeaderAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

export interface MobileHeaderConfig {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  actions?: MobileHeaderAction[];
  onBack?: () => void;
}

interface MobileHeaderProps {
  config: MobileHeaderConfig;
}

export const MobileHeader = ({ config }: MobileHeaderProps) => {
  return (
    <header className="mobile-header sticky top-0 bg-white border-b border-gray-200 z-40 md:hidden safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left Section - Back Button */}
        <div className="flex items-center">
          {config.showBack && config.onBack && (
            <button
              onClick={config.onBack}
              className="touch-target p-2 -ml-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Center Section - Title */}
        {config.title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-gray-900 truncate max-w-[60%]">
            {config.title}
          </h1>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          {config.showSearch && (
            <button
              className="touch-target p-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {config.showNotifications && (
            <button
              className="touch-target p-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          )}
          
          {config.showSettings && (
            <button
              className="touch-target p-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          
          {config.actions?.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="touch-target p-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors"
                aria-label={action.label}
              >
                <ActionIcon className="w-5 h-5" />
              </button>
            );
          })}
          
          {!config.showSearch && !config.showNotifications && !config.showSettings && !config.actions?.length && (
            <button
              className="touch-target p-2 text-gray-700 hover:text-gray-900 active:text-orange-600 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
