import React, { useState } from 'react';
import { cn } from './ui/utils';
import { LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  icon?: LucideIcon;
}

interface FuzoTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
  showContent?: boolean;
}

export function FuzoTabs({ 
  tabs, 
  defaultTab, 
  activeTab: controlledActiveTab,
  onTabChange,
  className,
  variant = 'default',
  showContent = true
}: FuzoTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  const activeTab = controlledActiveTab ?? internalActiveTab;
  
  const handleTabChange = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("", className)}>
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20",
                  activeTab === tab.id
                    ? "bg-white text-[#F14C35] shadow-sm"
                    : "text-gray-600 hover:text-[#0B1F3A]"
                )}
              >
                {IconComponent && (
                  <IconComponent className="w-4 h-4" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(showContent ? "space-y-6" : "", className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative py-3 px-1 font-medium text-sm whitespace-nowrap transition-colors duration-200 flex items-center space-x-2",
                  "focus:outline-none focus:ring-2 focus:ring-[#F14C35]/20 rounded-t-lg",
                  activeTab === tab.id
                    ? "text-[#F14C35] border-b-2 border-[#F14C35]"
                    : "text-gray-500 hover:text-[#0B1F3A]"
                )}
              >
                {IconComponent && (
                  <IconComponent className="w-4 h-4" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {showContent && (
        <div className="py-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                "transition-opacity duration-200",
                activeTab === tab.id ? "block" : "hidden"
              )}
            >
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
