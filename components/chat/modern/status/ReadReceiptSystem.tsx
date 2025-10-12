'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  Settings,
  Eye,
  EyeOff,
  MessageSquare
} from 'lucide-react';
import { ReadReceipt, ReadReceiptSettings, Message } from '../utils/ChatTypes';

interface ReadReceiptSystemProps {
  messageId?: string;
  receipts?: ReadReceipt[];
  settings?: ReadReceiptSettings;
  onSettingsChange?: (settings: ReadReceiptSettings) => void;
  onReceiptUpdate?: (messageId: string, receipt: ReadReceipt) => void;
  showSettings?: boolean;
}

interface ReadReceiptIndicatorProps {
  message: Message;
  receipts: ReadReceipt[];
  settings: ReadReceiptSettings;
  conversationParticipants?: string[];
}

const DEFAULT_SETTINGS: ReadReceiptSettings = {
  send_read_receipts: true,
  require_read_receipts: false,
  show_delivery_status: true
};

const ReadReceiptIndicator: React.FC<ReadReceiptIndicatorProps> = ({
  message,
  receipts,
  settings,
  conversationParticipants = []
}) => {
  const messageReceipts = receipts.filter(r => r.message_id === message.id);
  
  const receiptStatus = useMemo(() => {
    if (!settings.show_delivery_status) return null;
    
    const totalParticipants = conversationParticipants.length;
    const deliveredCount = messageReceipts.filter(r => r.delivered_at).length;
    const readCount = messageReceipts.filter(r => r.read_at).length;
    
    if (readCount === totalParticipants) {
      return { status: 'read', count: readCount, icon: CheckCheck, color: 'text-blue-500' };
    } else if (deliveredCount === totalParticipants) {
      return { status: 'delivered', count: deliveredCount, icon: CheckCheck, color: 'text-gray-500' };
    } else if (deliveredCount > 0) {
      return { status: 'partially_delivered', count: deliveredCount, icon: Check, color: 'text-gray-500' };
    } else {
      return { status: 'sent', count: 0, icon: Clock, color: 'text-gray-400' };
    }
  }, [messageReceipts, conversationParticipants.length, settings.show_delivery_status]);

  if (!receiptStatus || message.status === 'sending') {
    return message.status === 'sending' ? (
      <Clock className="w-3 h-3 text-gray-400" />
    ) : null;
  }

  const IconComponent = receiptStatus.icon;
  
  return (
    <div className="flex items-center gap-1">
      <IconComponent className={`w-3 h-3 ${receiptStatus.color}`} />
      {conversationParticipants.length > 2 && receiptStatus.count > 0 && (
        <span className={`text-xs ${receiptStatus.color}`}>
          {receiptStatus.count}
        </span>
      )}
    </div>
  );
};

const ReadReceiptDetails: React.FC<{
  messageId: string;
  receipts: ReadReceipt[];
  participants: { id: string; name: string; avatar?: string }[];
}> = ({ messageId, receipts, participants }) => {
  const messageReceipts = receipts.filter(r => r.message_id === messageId);
  
  const participantStatus = useMemo(() => {
    return participants.map(participant => {
      const receipt = messageReceipts.find(r => r.user_id === participant.id);
      return {
        ...participant,
        delivered_at: receipt?.delivered_at,
        read_at: receipt?.read_at,
        status: receipt?.read_at ? 'read' : receipt?.delivered_at ? 'delivered' : 'sent'
      };
    });
  }, [participants, messageReceipts]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Read by:</h4>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {participantStatus.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {participant.avatar ? (
                  <img 
                    src={participant.avatar} 
                    alt={participant.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {participant.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium">{participant.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {participant.status === 'read' ? (
                <>
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-gray-500">
                    {formatTime(participant.read_at!)}
                  </span>
                </>
              ) : participant.status === 'delivered' ? (
                <>
                  <CheckCheck className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {formatTime(participant.delivered_at!)}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Sent</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReadReceiptSystem: React.FC<ReadReceiptSystemProps> = ({
  messageId,
  receipts = [],
  settings: userSettings,
  onSettingsChange,
  onReceiptUpdate,
  showSettings = false
}) => {
  const [settings, setSettings] = useState<ReadReceiptSettings>({
    ...DEFAULT_SETTINGS,
    ...userSettings
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<ReadReceiptSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  }, [settings, onSettingsChange]);

  // Mark message as delivered
  const markAsDelivered = useCallback((messageId: string, userId: string) => {
    if (!settings.show_delivery_status) return;
    
    const receipt: ReadReceipt = {
      message_id: messageId,
      user_id: userId,
      delivered_at: new Date().toISOString()
    };
    
    onReceiptUpdate?.(messageId, receipt);
  }, [settings.show_delivery_status, onReceiptUpdate]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string, userId: string) => {
    if (!settings.send_read_receipts) return;
    
    const existingReceipt = receipts.find(r => 
      r.message_id === messageId && r.user_id === userId
    );
    
    const receipt: ReadReceipt = {
      message_id: messageId,
      user_id: userId,
      delivered_at: existingReceipt?.delivered_at || new Date().toISOString(),
      read_at: new Date().toISOString()
    };
    
    onReceiptUpdate?.(messageId, receipt);
  }, [settings.send_read_receipts, receipts, onReceiptUpdate]);

  // Bulk mark messages as read
  const markMultipleAsRead = useCallback((messageIds: string[], userId: string) => {
    if (!settings.send_read_receipts) return;
    
    messageIds.forEach(id => {
      markAsRead(id, userId);
    });
  }, [settings.send_read_receipts, markAsRead]);

  // Auto-mark as delivered when message is received
  useEffect(() => {
    if (messageId && settings.show_delivery_status) {
      // In a real implementation, this would be triggered by message receipt
      // markAsDelivered(messageId, currentUserId);
    }
  }, [messageId, settings.show_delivery_status, markAsDelivered]);

  // Auto-mark as read when message is viewed
  useEffect(() => {
    if (messageId && settings.send_read_receipts) {
      // In a real implementation, this would be triggered by message visibility
      // markAsRead(messageId, currentUserId);
    }
  }, [messageId, settings.send_read_receipts, markAsRead]);

  if (!showSettings) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Read Receipt Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Read Receipt Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Read Receipt Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <Label htmlFor="send-receipts">Send Read Receipts</Label>
                </div>
                <Checkbox
                  id="send-receipts"
                  checked={settings.send_read_receipts}
                  onCheckedChange={(checked: boolean) => updateSettings({ send_read_receipts: checked })}
                />
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Let others know when you&apos;ve read their messages
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4" />
                  <Label htmlFor="require-receipts">Require Read Receipts</Label>
                </div>
                <Checkbox
                  id="require-receipts"
                  checked={settings.require_read_receipts}
                  onCheckedChange={(checked: boolean) => updateSettings({ require_read_receipts: checked })}
                />
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Show when others have read your messages
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <Label htmlFor="show-delivery">Show Delivery Status</Label>
                </div>
                <Checkbox
                  id="show-delivery"
                  checked={settings.show_delivery_status}
                  onCheckedChange={(checked: boolean) => updateSettings({ show_delivery_status: checked })}
                />
              </div>
              <p className="text-xs text-gray-600 ml-6">
                Show delivery confirmations for your messages
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <EyeOff className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-blue-900">Privacy Notice</h5>
                  <p className="text-xs text-blue-700 mt-1">
                    When you disable read receipts, you also won&apos;t see read receipts from others.
                    Delivery status and read receipts help improve the messaging experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="space-y-3">
              <h4 className="font-medium">Status Indicators</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Sent - Message sent from your device</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-gray-500" />
                  <span>Delivered - Message delivered to recipient</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCheck className="w-4 h-4 text-gray-500" />
                  <span>Delivered to all - Message delivered to all recipients</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                  <span>Read - Message read by recipient(s)</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Export components and utility functions
export { ReadReceiptIndicator, ReadReceiptDetails };

export const useReadReceipts = (settings: ReadReceiptSettings) => {
  return {
    markAsDelivered: useCallback((messageId: string, userId: string) => {
      if (!settings.show_delivery_status) return null;
      
      return {
        message_id: messageId,
        user_id: userId,
        delivered_at: new Date().toISOString()
      };
    }, [settings.show_delivery_status]),
    
    markAsRead: useCallback((messageId: string, userId: string) => {
      if (!settings.send_read_receipts) return null;
      
      return {
        message_id: messageId,
        user_id: userId,
        delivered_at: new Date().toISOString(),
        read_at: new Date().toISOString()
      };
    }, [settings.send_read_receipts]),
    
    shouldShowReceipts: settings.require_read_receipts,
    shouldSendReceipts: settings.send_read_receipts,
    shouldShowDelivery: settings.show_delivery_status
  };
};

export default ReadReceiptSystem;