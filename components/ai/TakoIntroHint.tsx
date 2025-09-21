import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

// Tako AI mascot image - using a placeholder for now
const takoAI =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGMTQzMzUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMiIgZmlsbD0iI0ZGRkZGRiIvPgo8Y2lyY2xlIGN4PSIyNCIgY3k9IjE2IiByPSIyIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0xNiAyNEMxNiAyNCAxOCAyNiAyMCAyNkMyMiAyNiAyNCAyNCAyNCAyNCIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K";

interface TakoIntroHintProps {
  onDismiss?: () => void;
  onTryNow?: () => void;
}

export function TakoIntroHint({ onDismiss, onTryNow }: TakoIntroHintProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem("fuzo_tako_intro_seen");

    if (!hasSeenIntro) {
      // Show intro after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("fuzo_tako_intro_seen", "true");
    onDismiss?.();
  };

  const handleTryNow = () => {
    setIsVisible(false);
    localStorage.setItem("fuzo_tako_intro_seen", "true");
    onTryNow?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[60]"
            onClick={handleDismiss}
          />

          {/* Hint Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-28 right-6 z-[70] bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#F14C35] to-[#A6471E] p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                    <ImageWithFallback
                      src={takoAI}
                      alt="Tako AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Hey! I'm Tako 🐙</h3>
                    <p className="text-white/80 text-sm">
                      Your AI food assistant
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#FFD74A]" />
                  <h4 className="font-bold text-[#0B1F3A]">
                    I'm here to help!
                  </h4>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  I can help you discover restaurants, find recipes, navigate
                  the app, and answer any food-related questions you have!
                </p>
              </div>

              {/* Feature highlights */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#0B1F3A]">
                      Ask anything
                    </p>
                    <p className="text-xs text-gray-500">
                      "Find me good sushi nearby"
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#0B1F3A]">
                      Smart suggestions
                    </p>
                    <p className="text-xs text-gray-500">
                      Personalized recommendations
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleTryNow}
                  className="flex-1 bg-[#F14C35] text-white py-3 rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
                >
                  Try Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>

            {/* Pointer arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
          </motion.div>

          {/* Pulsing indicator around Tako bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.3 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1.5,
              ease: "easeInOut",
            }}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full border-4 border-[#F14C35] z-[65] pointer-events-none"
          />
        </>
      )}
    </AnimatePresence>
  );
}
