'use client';

import { Button } from '@/components/ui/button';
import { Heart, X, Star, MessageCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface SwipeActionsProps {
  onPass?: () => void;
  onLike?: () => void;
  onSuperLike?: () => void;
  onRewind?: () => void;
  onMessage?: () => void;
  disabled?: boolean;
}

export function SwipeActions({
  onPass,
  onLike,
  onSuperLike,
  onRewind,
  onMessage,
  disabled = false
}: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {/* Rewind Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50"
          onClick={onRewind}
          disabled={disabled}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Pass Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          onClick={onPass}
          disabled={disabled}
        >
          <X className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Super Like Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
          onClick={onSuperLike}
          disabled={disabled}
        >
          <Star className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Like Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
          onClick={onLike}
          disabled={disabled}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Message Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-2 border-purple-500 text-purple-500 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50"
          onClick={onMessage}
          disabled={disabled}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}