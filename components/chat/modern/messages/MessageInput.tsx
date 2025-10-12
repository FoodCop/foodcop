'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file') => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onAttachment?: () => void;
  onVoiceRecord?: () => void;
  onEmojiPicker?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onAttachment,
  onVoiceRecord,
  onEmojiPicker,
  placeholder = "Type message here",
  disabled = false,
  className = ''
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [message]);

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Typing indicator logic
    if (value.trim() && !typingTimeoutRef.current) {
      onTypingStart?.();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
      typingTimeoutRef.current = undefined;
    }, 1000);
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage, 'text');
      setMessage('');
      onTypingStop?.();
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // TODO: Stop recording and send voice message
      onVoiceRecord?.();
    } else {
      setIsRecording(true);
      // TODO: Start recording
      onVoiceRecord?.();
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className={`bg-white border-t border-gray-200 p-4 ${className}`}>
      <div className="flex items-end gap-3">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-full hover:bg-gray-100 p-0 flex-shrink-0"
          onClick={onAttachment}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5 text-gray-500" />
        </Button>

        {/* Message Input Area */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-gray-100 rounded-2xl px-4 py-2">
            {/* Emoji Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full hover:bg-gray-200 p-0 flex-shrink-0 mr-2"
              onClick={onEmojiPicker}
              disabled={disabled}
            >
              <Smile className="h-4 w-4 text-gray-500" />
            </Button>

            {/* Text Input */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 border-0 bg-transparent resize-none focus:ring-0 focus:outline-none text-sm py-2 px-0 min-h-[20px] max-h-[100px] placeholder:text-gray-500"
              rows={1}
            />
          </div>
        </div>

        {/* Send/Voice Button */}
        {canSend ? (
          <Button
            size="sm"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#FF6B35]/90 hover:to-[#F7931E]/90 text-white p-0 flex-shrink-0"
            onClick={handleSend}
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 w-10 rounded-full p-0 flex-shrink-0 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            onClick={handleVoiceRecord}
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center mt-3 text-red-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}