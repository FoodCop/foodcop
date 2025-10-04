'use client';

import { cn } from '@/lib/utils';
import { 
  MapPin, 
  ChefHat, 
  Users, 
  Camera, 
  Video, 
  Award, 
  Star 
} from 'lucide-react';

type PlateTab = 'places' | 'recipes' | 'crew' | 'photos' | 'videos' | 'rewards' | 'points';

interface TabConfig {
  id: PlateTab;
  label: string;
  icon: string;
  count: number;
}

interface PlateNavigationProps {
  tabs: TabConfig[];
  activeTab: PlateTab;
  onTabChange: (tab: PlateTab) => void;
}

const iconMap = {
  MapPin,
  ChefHat,
  Users,
  Camera,
  Video,
  Award,
  Star
};

export function PlateNavigation({ tabs, activeTab, onTabChange }: PlateNavigationProps) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = iconMap[tab.icon as keyof typeof iconMap];
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    'ml-2 px-2 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}