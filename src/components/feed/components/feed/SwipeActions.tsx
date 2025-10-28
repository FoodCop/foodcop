import { RotateCcw, X, Star, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SwipeActionsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onRewind: () => void;
  onMessage: () => void;
  canRewind?: boolean;
  disabled?: boolean;
}

export function SwipeActions({
  onPass,
  onLike,
  onSuperLike,
  onRewind,
  onMessage,
  canRewind = false,
  disabled = false,
}: SwipeActionsProps) {
  return (
    <div className="hidden md:flex items-center justify-center gap-4 px-6 py-6">
      {/* Rewind */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onRewind}
        disabled={disabled || !canRewind}
        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-5 h-5 text-yellow-500" />
      </motion.button>
      
      {/* Pass */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onPass}
        disabled={disabled}
        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <X className="w-7 h-7 text-red-500" />
      </motion.button>
      
      {/* Super Like */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onSuperLike}
        disabled={disabled}
        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
      </motion.button>
      
      {/* Like */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        disabled={disabled}
        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Heart className="w-7 h-7 text-green-500 fill-green-500" />
      </motion.button>
      
      {/* Message */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onMessage}
        disabled={disabled}
        className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <MessageCircle className="w-5 h-5 text-purple-500 fill-purple-500" />
      </motion.button>
    </div>
  );
}