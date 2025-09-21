import { motion } from "framer-motion";
import { ChefHat, Star, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

interface GamificationPopupProps {
  points: number;
  action?: string;
  message?: string;
  currentPoints?: number;
  onClose: () => void;
}

const badgeData = [
  {
    name: "Home Chef",
    minPoints: 0,
    maxPoints: 499,
    icon: ChefHat,
    color: "#A6471E",
  },
  {
    name: "Recipe Explorer",
    minPoints: 500,
    maxPoints: 1499,
    icon: Star,
    color: "#FFD74A",
  },
  {
    name: "Master Chef",
    minPoints: 1500,
    maxPoints: Infinity,
    icon: Trophy,
    color: "#F14C35",
  },
];

export function GamificationPopup({
  points,
  action,
  message,
  currentPoints,
  onClose,
}: GamificationPopupProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  const currentBadge =
    badgeData.find(
      (badge) =>
        (currentPoints || 0) >= badge.minPoints &&
        (currentPoints || 0) <= badge.maxPoints
    ) || badgeData[0];

  const nextBadge = badgeData.find(
    (badge) => badge.minPoints > (currentPoints || 0)
  );

  const progressToNext = nextBadge
    ? Math.min(
        (((currentPoints || 0) - currentBadge.minPoints) /
          (nextBadge.minPoints - currentBadge.minPoints)) *
          100,
        100
      )
    : 100;

  useEffect(() => {
    setShowAnimation(true);
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-4 text-6xl">🐙</div>
          <div className="absolute bottom-4 left-4 text-4xl">✨</div>
          <div className="absolute top-1/2 left-1/4 text-3xl">🍳</div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Tako Mascot Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: showAnimation ? [1, 1.2, 1] : 0 }}
            transition={{ duration: 0.6, times: [0, 0.6, 1] }}
            className="text-6xl mb-4"
          >
            🐙
          </motion.div>

          {/* Celebration Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold text-[#0B1F3A] mb-2">
              Great job!
            </h2>
            <p className="text-gray-600 mb-4">
              {message || `+${points} points for ${action || "your action"} 🎉`}
            </p>
          </motion.div>

          {/* Points Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] text-white rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">{currentPoints} Points</span>
            </div>
            <p className="text-sm opacity-90">Total earned</p>
          </motion.div>

          {/* Current Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-4"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentBadge.color }}
              >
                <currentBadge.icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-[#0B1F3A]">
                {currentBadge.name}
              </span>
            </div>

            {/* Progress to Next Badge */}
            {nextBadge && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress to {nextBadge.name}</span>
                  <span>{Math.round(progressToNext)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNext}%` }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="bg-gradient-to-r from-[#FFD74A] to-[#F14C35] h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {nextBadge.minPoints - currentPoints} points to go!
                </p>
              </div>
            )}
          </motion.div>

          {/* Tako's Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-[#F8F9FA] rounded-xl p-3 relative"
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-[#F8F9FA] rotate-45"></div>
            </div>
            <p className="text-sm text-gray-700 italic">
              "Keep exploring delicious recipes! You're doing amazing!" - Tako
              🐙
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex space-x-3 mt-6"
          >
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Continue
            </button>
            <button className="flex-1 px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors">
              View Achievements
            </button>
          </motion.div>
        </div>

        {/* Confetti Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showAnimation ? [0, 1, 0] : 0 }}
          transition={{ duration: 2, times: [0, 0.3, 1] }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 200}%`,
                y: `${50 + (Math.random() - 0.5) * 200}%`,
                scale: [0, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: 2,
                delay: 0.5 + i * 0.1,
                ease: "easeOut",
              }}
              className="absolute text-2xl"
              style={{
                left: 0,
                top: 0,
              }}
            >
              {["🎉", "✨", "🌟", "🏆"][i % 4]}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
