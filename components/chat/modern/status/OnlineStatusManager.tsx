'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Circle, 
  Settings, 
  Eye, 
  EyeOff, 
  Clock,
  Activity,
  Users
} from 'lucide-react';
import { UserPresence, PresenceSettings, UserActivity } from '../utils/ChatTypes';

interface OnlineStatusManagerProps {
  currentUserId: string;
  onPresenceUpdate?: (presence: UserPresence) => void;
  onSettingsChange?: (settings: PresenceSettings) => void;
  initialPresence?: UserPresence;
  initialSettings?: PresenceSettings;
}

const DEFAULT_PRESENCE: UserPresence = {
  user_id: '',
  status: 'online',
  last_seen: new Date().toISOString(),
  custom_status: '',
  activity: ''
};

const DEFAULT_SETTINGS: PresenceSettings = {
  show_online_status: true,
  show_last_seen: true,
  show_activity_status: true,
  auto_away_minutes: 10,
  invisible_mode: false
};

const OnlineStatusManager: React.FC<OnlineStatusManagerProps> = ({
  currentUserId,
  onPresenceUpdate,
  onSettingsChange,
  initialPresence,
  initialSettings
}) => {
  const [presence, setPresence] = useState<UserPresence>({
    ...DEFAULT_PRESENCE,
    user_id: currentUserId,
    ...initialPresence
  });
  const [settings, setSettings] = useState<PresenceSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  });
  const [currentActivity, setCurrentActivity] = useState<UserActivity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Activity tracking
  const updateActivity = useCallback((activityType: UserActivity['activity_type'] = 'idle') => {
    setLastActivityTime(Date.now());
    
    const newActivity: UserActivity = {
      user_id: currentUserId,
      conversation_id: 'global',
      activity_type: activityType,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setCurrentActivity(newActivity);
    
    // Clear existing timeouts
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }
    
    // Set activity back to idle after 30 seconds of no activity
    if (activityType !== 'idle') {
      activityTimeoutRef.current = setTimeout(() => {
        setCurrentActivity(prev => prev ? { ...prev, activity_type: 'idle' } : null);
      }, 30000);
    }
    
    // Set status to away after configured minutes of inactivity
    if (presence.status === 'online' && !settings.invisible_mode) {
      awayTimeoutRef.current = setTimeout(() => {
        setPresence(prev => ({
          ...prev,
          status: 'away',
          last_seen: new Date().toISOString()
        }));
      }, settings.auto_away_minutes * 60 * 1000);
    }
  }, [currentUserId, presence.status, settings.invisible_mode, settings.auto_away_minutes]);

  // Update presence status
  const updatePresenceStatus = useCallback((newStatus: UserPresence['status'], customStatus?: string) => {
    const updatedPresence: UserPresence = {
      ...presence,
      status: settings.invisible_mode ? 'invisible' : newStatus,
      last_seen: new Date().toISOString(),
      custom_status: customStatus !== undefined ? customStatus : presence.custom_status,
      activity: settings.show_activity_status ? currentActivity?.activity_type || '' : ''
    };
    
    setPresence(updatedPresence);
    onPresenceUpdate?.(updatedPresence);
    
    // Reset activity tracking when coming back online
    if (newStatus === 'online') {
      updateActivity('idle');
    }
  }, [presence, settings.invisible_mode, settings.show_activity_status, currentActivity, onPresenceUpdate, updateActivity]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PresenceSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
    
    // Apply settings immediately
    if (newSettings.invisible_mode !== undefined) {
      updatePresenceStatus(newSettings.invisible_mode ? 'invisible' : 'online');
    }
    
    if (newSettings.show_activity_status === false) {
      setPresence(prev => ({ ...prev, activity: '' }));
    }
  }, [settings, onSettingsChange, updatePresenceStatus]);

  // Browser activity detection
  useEffect(() => {
    const handleActivity = () => {
      updateActivity('idle');
      
      // If user was away, bring them back online
      if (presence.status === 'away') {
        updatePresenceStatus('online');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresenceStatus('away');
      } else {
        updatePresenceStatus('online');
        updateActivity('idle');
      }
    };

    // Add event listeners for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [presence.status, updateActivity, updatePresenceStatus]);

  // Heartbeat to server
  useEffect(() => {
    if (presence.status === 'online' && !settings.invisible_mode) {
      heartbeatIntervalRef.current = setInterval(() => {
        const updatedPresence = {
          ...presence,
          last_seen: new Date().toISOString()
        };
        setPresence(updatedPresence);
        onPresenceUpdate?.(updatedPresence);
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [presence.status, settings.invisible_mode, presence, onPresenceUpdate]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (awayTimeoutRef.current) clearTimeout(awayTimeoutRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Format last seen time
  const formatLastSeen = (lastSeen: string): string => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastSeenDate.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: UserPresence['status']): string => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      case 'busy': return 'text-red-500';
      case 'invisible':
      case 'offline': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Get status text
  const getStatusText = (status: UserPresence['status']): string => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      case 'invisible': return 'Invisible';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  // Track specific activities
  const trackTyping = useCallback((conversationId: string) => {
    setCurrentActivity({
      user_id: currentUserId,
      conversation_id: conversationId,
      activity_type: 'typing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }, [currentUserId]);

  const trackVoiceRecording = useCallback((conversationId: string) => {
    setCurrentActivity({
      user_id: currentUserId,
      conversation_id: conversationId,
      activity_type: 'recording_voice',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }, [currentUserId]);

  const trackMediaSelection = useCallback((conversationId: string) => {
    setCurrentActivity({
      user_id: currentUserId,
      conversation_id: conversationId,
      activity_type: 'selecting_media',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }, [currentUserId]);

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Circle className={`w-3 h-3 fill-current ${getStatusColor(presence.status)}`} />
          {currentActivity && currentActivity.activity_type !== 'idle' && settings.show_activity_status && (
            <div className="absolute -top-1 -right-1">
              <Activity className="w-2 h-2 text-orange-500" />
            </div>
          )}
        </div>
        
        <span className={`text-sm font-medium ${getStatusColor(presence.status)}`}>
          {getStatusText(presence.status)}
        </span>
        
        {presence.custom_status && (
          <Badge variant="secondary" className="text-xs">
            {presence.custom_status}
          </Badge>
        )}
      </div>

      {/* Status Settings */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Status Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Selection */}
            <div className="space-y-3">
              <Label htmlFor="status-select">Status</Label>
              <Select
                value={settings.invisible_mode ? 'invisible' : presence.status}
                onValueChange={(value) => updatePresenceStatus(value as UserPresence['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-current text-green-500" />
                      Online
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-current text-yellow-500" />
                      Away
                    </div>
                  </SelectItem>
                  <SelectItem value="busy">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-current text-red-500" />
                      Busy
                    </div>
                  </SelectItem>
                  <SelectItem value="invisible">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-current text-gray-400" />
                      Invisible
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Status Message */}
            <div className="space-y-3">
              <Label htmlFor="custom-status">Custom Status Message</Label>
              <Input
                id="custom-status"
                placeholder="What's on your mind?"
                value={presence.custom_status || ''}
                onChange={(e) => updatePresenceStatus(presence.status, e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Privacy Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <Label htmlFor="show-online-status">Show Online Status</Label>
                </div>
                <Checkbox
                  id="show-online-status"
                  checked={settings.show_online_status}
                  onCheckedChange={(checked: boolean) => updateSettings({ show_online_status: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <Label htmlFor="show-last-seen">Show Last Seen</Label>
                </div>
                <Checkbox
                  id="show-last-seen"
                  checked={settings.show_last_seen}
                  onCheckedChange={(checked: boolean) => updateSettings({ show_last_seen: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <Label htmlFor="show-activity">Show Activity Status</Label>
                </div>
                <Checkbox
                  id="show-activity"
                  checked={settings.show_activity_status}
                  onCheckedChange={(checked: boolean) => updateSettings({ show_activity_status: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  <Label htmlFor="invisible-mode">Invisible Mode</Label>
                </div>
                <Checkbox
                  id="invisible-mode"
                  checked={settings.invisible_mode}
                  onCheckedChange={(checked: boolean) => updateSettings({ invisible_mode: checked })}
                />
              </div>
            </div>

            {/* Auto Away Settings */}
            <div className="space-y-3">
              <Label htmlFor="auto-away">Auto Away (minutes)</Label>
              <Select
                value={settings.auto_away_minutes.toString()}
                onValueChange={(value) => updateSettings({ auto_away_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Activity Info */}
            {currentActivity && currentActivity.activity_type !== 'idle' && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Current Activity</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {currentActivity.activity_type.replace('_', ' ')}
                </p>
                {settings.show_last_seen && (
                  <p className="text-xs text-gray-500 mt-1">
                    Started {formatLastSeen(currentActivity.started_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expose activity tracking functions */}
      <div className="hidden">
        <button onClick={() => trackTyping('test')} />
        <button onClick={() => trackVoiceRecording('test')} />
        <button onClick={() => trackMediaSelection('test')} />
      </div>
    </div>
  );
};

// Export activity tracking functions for use in other components
export const useActivityTracker = (statusManager: OnlineStatusManagerProps) => {
  return {
    trackTyping: (conversationId: string) => {
      // This would be connected to the status manager instance
    },
    trackVoiceRecording: (conversationId: string) => {
      // This would be connected to the status manager instance
    },
    trackMediaSelection: (conversationId: string) => {
      // This would be connected to the status manager instance
    },
    stopActivity: () => {
      // This would be connected to the status manager instance
    }
  };
};

export default OnlineStatusManager;