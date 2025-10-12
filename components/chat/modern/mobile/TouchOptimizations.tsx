// Mobile Touch Optimization Component
// Enhanced touch interface for better mobile experience

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Trash2, 
  Archive, 
  Pin,
  Volume,
  VolumeX,
  Clock,
  Check,
  CheckCheck,
  ArrowUp,
  Vibrate
} from 'lucide-react';

// Touch gesture types
interface TouchGestureState {
  isDragging: boolean;
  dragOffset: number;
  direction: 'left' | 'right' | null;
  velocity: number;
  threshold: number;
}

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  threshold: number;
}

// Enhanced touch-optimized message item
interface TouchOptimizedMessageItemProps {
  message: {
    id: string;
    content: string;
    sender_name: string;
    timestamp: string;
    unread_count?: number;
    is_pinned?: boolean;
    is_muted?: boolean;
    status?: 'sent' | 'delivered' | 'read';
  };
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onTap?: () => void;
  onLongPress?: () => void;
  enableHapticFeedback?: boolean;
  className?: string;
}

export const TouchOptimizedMessageItem: React.FC<TouchOptimizedMessageItemProps> = ({
  message,
  leftActions = [],
  rightActions = [],
  onTap,
  onLongPress,
  enableHapticFeedback = true,
  className
}) => {
  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isDragging: false,
    dragOffset: 0,
    direction: null,
    velocity: 0,
    threshold: 80
  });
  
  const [showActions, setShowActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Haptic feedback function
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    
    navigator.vibrate(patterns[type]);
  }, [enableHapticFeedback]);

  // Default swipe actions
  const defaultLeftActions: SwipeAction[] = [
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'bg-blue-500',
      action: () => {
        triggerHaptic('medium');
        console.log('Archive message:', message.id);
      },
      threshold: 80
    }
  ];

  const defaultRightActions: SwipeAction[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'bg-red-500',
      action: () => {
        triggerHaptic('heavy');
        console.log('Delete message:', message.id);
      },
      threshold: 80
    },
    {
      id: 'pin',
      label: message.is_pinned ? 'Unpin' : 'Pin',
      icon: Pin,
      color: 'bg-orange-500',
      action: () => {
        triggerHaptic('medium');
        console.log('Toggle pin:', message.id);
      },
      threshold: 120
    }
  ];

  const activeLeftActions = leftActions.length > 0 ? leftActions : defaultLeftActions;
  const activeRightActions = rightActions.length > 0 ? rightActions : defaultRightActions;

  // Touch event state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Touch event handlers
  const handleTouchStartEvent = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    
    // Start long press timer
    const timer = setTimeout(() => {
      triggerHaptic('medium');
      onLongPress?.();
    }, 500);
    setLongPressTimer(timer);
  }, [onLongPress, triggerHaptic]);

  const handleTouchMoveEvent = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Determine if this is a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsDragging(true);
      const direction = deltaX > 0 ? 'right' : 'left';
      
      setGestureState(prev => ({
        ...prev,
        isDragging: true,
        dragOffset: deltaX,
        direction,
        velocity: Math.abs(deltaX) / (Date.now() - touchStart.time)
      }));

      // Trigger haptic feedback at thresholds
      if (Math.abs(deltaX) > 60 && !showActions) {
        triggerHaptic('light');
        setShowActions(true);
      }
      
      // Clear long press timer if dragging
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  }, [touchStart, longPressTimer, showActions, triggerHaptic]);

  const handleTouchEndEvent = useCallback((e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!touchStart || !isDragging) {
      // Handle tap
      if (!isDragging && touchStart && Date.now() - touchStart.time < 300) {
        onTap?.();
      }
      setTouchStart(null);
      return;
    }
    
    const deltaX = gestureState.dragOffset;
    
    // Reset state
    setGestureState(prev => ({
      ...prev,
      isDragging: false,
      dragOffset: 0,
      direction: null,
      velocity: 0
    }));
    setShowActions(false);
    setIsDragging(false);
    setTouchStart(null);
    
    // Execute action if dragged far enough
    if (Math.abs(deltaX) > 120) {
      const actions = deltaX > 0 ? activeLeftActions : activeRightActions;
      const actionToExecute = actions.find(action => Math.abs(deltaX) > action.threshold);
      
      if (actionToExecute) {
        actionToExecute.action();
      }
    }
  }, [touchStart, isDragging, gestureState.dragOffset, activeLeftActions, activeRightActions, onTap, longPressTimer]);

  // Long press handling
  const handleTouchCancelEvent = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setGestureState(prev => ({
      ...prev,
      isDragging: false,
      dragOffset: 0,
      direction: null
    }));
    setShowActions(false);
    setIsDragging(false);
    setTouchStart(null);
  }, [longPressTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  // Status icon component
  const StatusIcon = () => {
    if (!message.status) return null;
    
    switch (message.status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Render swipe actions
  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    const isVisible = gestureState.isDragging && 
      ((side === 'left' && gestureState.direction === 'right') ||
       (side === 'right' && gestureState.direction === 'left'));
    
    if (!isVisible) return null;

    return (
      <div className={cn(
        "absolute top-0 bottom-0 flex items-center",
        side === 'left' ? 'left-0' : 'right-0'
      )}>
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          const shouldHighlight = Math.abs(gestureState.dragOffset) > action.threshold;
          
          return (
            <div
              key={action.id}
              className={cn(
                "h-full flex items-center justify-center px-4 transition-all duration-200",
                action.color,
                shouldHighlight ? 'opacity-100 scale-110' : 'opacity-80 scale-100'
              )}
              style={{
                width: `${Math.min(Math.abs(gestureState.dragOffset) / actions.length, 80)}px`
              }}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background swipe actions */}
      {renderActions(activeLeftActions, 'left')}
      {renderActions(activeRightActions, 'right')}
      
      {/* Main message content */}
      <Card
        ref={itemRef}
        className={cn(
          "relative bg-white transition-transform duration-200 ease-out",
          "touch-pan-y", // Allow vertical scrolling
          gestureState.isDragging ? 'shadow-lg' : 'shadow-sm',
          className
        )}
        style={{
          transform: `translateX(${gestureState.dragOffset}px)`
        }}
        onTouchStart={handleTouchStartEvent}
        onTouchMove={handleTouchMoveEvent}
        onTouchEnd={handleTouchEndEvent}
        onTouchCancel={handleTouchCancelEvent}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {message.sender_name}
                </h3>
                {message.is_pinned && (
                  <Pin className="h-3 w-3 text-orange-500" />
                )}
                {message.is_muted && (
                  <VolumeX className="h-3 w-3 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate mt-1">
                {message.content}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-1 ml-2">
              <span className="text-xs text-gray-400">
                {message.timestamp}
              </span>
              <div className="flex items-center gap-1">
                <StatusIcon />
                {message.unread_count && message.unread_count > 0 && (
                  <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {message.unread_count > 99 ? '99+' : message.unread_count}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Enhanced touch-optimized input component
interface TouchOptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  enableVoiceInput?: boolean;
  enableHapticFeedback?: boolean;
  className?: string;
}

export const TouchOptimizedInput: React.FC<TouchOptimizedInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  enableVoiceInput = true,
  enableHapticFeedback = true,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: 10,
      medium: 50,
      heavy: 100
    };
    
    navigator.vibrate(patterns[type]);
  }, [enableHapticFeedback]);

  const handleSend = useCallback(() => {
    if (value.trim()) {
      triggerHaptic('medium');
      onSend();
    }
  }, [value, onSend, triggerHaptic]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={cn(
      "flex items-end gap-2 p-3 bg-white border-t border-gray-200",
      isFocused && "bg-gray-50",
      className
    )}>
      {/* Voice input button */}
      {enableVoiceInput && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-10 w-10 rounded-full"
          onTouchStart={() => triggerHaptic('light')}
        >
          <Vibrate className="h-4 w-4" />
        </Button>
      )}

      {/* Message input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full resize-none border border-gray-300 rounded-2xl px-4 py-2",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent",
            "text-sm leading-5 max-h-24 min-h-[40px]",
            "bg-white placeholder-gray-400"
          )}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </div>

      {/* Send button */}
      <Button
        size="sm"
        className={cn(
          "shrink-0 h-10 w-10 rounded-full transition-all duration-200",
          "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
          value.trim() ? 'scale-100 opacity-100' : 'scale-90 opacity-50'
        )}
        onClick={handleSend}
        disabled={!value.trim()}
        onTouchStart={() => triggerHaptic('light')}
      >
        <ArrowUp className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
};

// Export all touch optimization components
export const TouchOptimizations = {
  TouchOptimizedMessageItem,
  TouchOptimizedInput
};