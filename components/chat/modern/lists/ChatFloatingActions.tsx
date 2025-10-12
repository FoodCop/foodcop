'use client';

import React, { useState } from 'react';
import { UserPlus, Users, Camera, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatFloatingActionsProps {
  onNewContact?: () => void;
  onNewGroup?: () => void;
  onCamera?: () => void;
  onNewChat?: () => void;
  className?: string;
}

export function ChatFloatingActions({ 
  onNewContact, 
  onNewGroup, 
  onCamera, 
  onNewChat,
  className = '' 
}: ChatFloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const actionButtons = [
    {
      icon: UserPlus,
      label: 'New Contact',
      action: () => onNewContact?.(),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      label: 'New Group',
      action: () => onNewGroup?.(),
      color: 'from-green-500 to-green-600',
    },
    {
      icon: MessageCircle,
      label: 'New Chat',
      action: () => onNewChat?.(),
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Camera,
      label: 'Camera',
      action: () => onCamera?.(),
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 space-y-3"
          >
            {actionButtons.map((button, index) => (
              <motion.div
                key={button.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.8,
                  transition: { delay: (actionButtons.length - index - 1) * 0.05 }
                }}
                className="flex items-center gap-3"
              >
                {/* Action Label */}
                <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                  {button.label}
                </div>
                
                {/* Action Button */}
                <Button
                  size="lg"
                  className={`h-12 w-12 rounded-full bg-gradient-to-r ${button.color} hover:scale-110 text-white shadow-lg hover:shadow-xl transition-all duration-200 p-0`}
                  onClick={() => handleAction(button.action)}
                >
                  <button.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 p-0 ${
            isOpen 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#FF6B35]/90 hover:to-[#F7931E]/90'
          } text-white`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageCircle className="h-6 w-6" />
            )}
          </motion.div>
        </Button>
      </motion.div>

      {/* Background Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}