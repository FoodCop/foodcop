import React, { useEffect, useRef, useState } from "react";
import { SafeRestaurantImage } from "../ui/SafeRestaurantImage";

interface SwipeCardProps {
  image: string;
  title: string;
  subtitle: string;
  profileName: string;
  profileDesignation: string;
  tags: string[];
  onSwipe: (direction: "left" | "right" | "up" | "down") => void;
  isActive: boolean;
  isMasterBot?: boolean;
  botData?: {
    username: string;
    specialties: string[];
    location?: string;
    avatar_url?: string;
    restaurant?: {
      name: string;
      location: string;
      rating: number;
      price_range: string;
      cuisine: string;
      reviews_count: number;
    };
  };
  onLike?: () => void;
  onSkip?: () => void;
  onSaveToPlate?: () => void;
  onShare?: () => void;
}

export function SwipeCard({
  image,
  title,
  subtitle,
  profileName,
  profileDesignation,
  tags,
  onSwipe,
  isActive,
  isMasterBot = false,
  botData,
  onLike,
  onSkip,
  onSaveToPlate,
  onShare,
}: SwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = (clientX: number, clientY: number) => {
    if (!isActive) return;
    setIsDragging(true);
    startPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isActive) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    setDragOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1);
  };

  const handleEnd = () => {
    if (!isDragging || !isActive) return;
    setIsDragging(false);

    const threshold = 100;
    const verticalThreshold = 80;

    // Horizontal swipes (left/right)
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? "right" : "left");
    }
    // Vertical swipes (up/down)
    else if (Math.abs(dragOffset.y) > verticalThreshold) {
      onSwipe(dragOffset.y < 0 ? "up" : "down");
    }

    setDragOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX, e.clientY);
      };
      const handleGlobalMouseUp = () => {
        handleEnd();
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    opacity: isActive ? 1 : 0.8,
    zIndex: isActive ? 10 : 1,
    transition: isDragging ? "none" : "all 0.3s ease-out",
  };

  const getSwipeIndicator = () => {
    if (!isDragging) return null;

    const horizontalThreshold = 50;
    const verticalThreshold = 40;

    // Horizontal swipe indicators
    if (Math.abs(dragOffset.x) > horizontalThreshold) {
      return (
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-3xl border-4 ${
            dragOffset.x > 0
              ? "bg-green-500/20 border-green-500"
              : "bg-red-500/20 border-red-500"
          }`}
        >
          <div
            className={`text-4xl font-bold ${
              dragOffset.x > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {dragOffset.x > 0 ? "❤️" : "👎"}
          </div>
        </div>
      );
    }

    // Vertical swipe indicators
    if (Math.abs(dragOffset.y) > verticalThreshold) {
      return (
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-3xl border-4 ${
            dragOffset.y < 0
              ? "bg-blue-500/20 border-blue-500"
              : "bg-yellow-500/20 border-yellow-500"
          }`}
        >
          <div
            className={`text-4xl font-bold ${
              dragOffset.y < 0 ? "text-blue-500" : "text-yellow-500"
            }`}
          >
            {dragOffset.y < 0 ? "📤" : "🍽️"}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Background Image */}
        <SafeRestaurantImage
          src={image}
          restaurantName={title}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Swipe Indicator */}
        {getSwipeIndicator()}

        {/* Master Bot Publisher - Top Left */}
        <div className="absolute top-6 left-6 flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
              {botData?.avatar_url ? (
                <img
                  src={botData.avatar_url}
                  alt={profileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to robot emoji if image fails to load
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-[#F14C35] flex items-center justify-center ${
                  botData?.avatar_url ? "hidden" : ""
                }`}
              >
                <span className="text-white font-bold text-lg">🤖</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD74A] rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[#0B1F3A] text-xs">✓</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <p className="text-white font-semibold text-sm">{profileName}</p>
              <span className="px-2 py-0.5 bg-[#FFD74A]/90 text-[#0B1F3A] rounded-full text-xs font-medium">
                {profileDesignation}
              </span>
            </div>
            {botData?.location && (
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-white/60 text-xs">
                  📍 {botData.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white text-[20px]">
              {title}
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">{subtitle}</p>
          </div>

          {/* Restaurant Details - Show actual data from master bot posts */}
          <div className="flex items-center space-x-4 text-white/80 text-sm">
            <span className="flex items-center space-x-1">
              <span>⭐</span>
              <span>{botData?.restaurant?.rating || "4.5"}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>💰</span>
              <span>{botData?.restaurant?.price_range || "$$$"}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>👥</span>
              <span>
                {botData?.restaurant?.reviews_count
                  ? `${botData.restaurant.reviews_count}`
                  : "7.1k"}{" "}
                reviews
              </span>
            </span>
          </div>

          {/* Restaurant Location */}
          {botData?.restaurant?.location && (
            <div className="flex items-center space-x-1 text-white/80 text-sm">
              <span>📍</span>
              <span>{botData.restaurant.location}</span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full border border-white/30"
              >
                #{tag}
              </span>
            ))}
            <span className="px-3 py-1 bg-[#FFD74A]/90 text-[#0B1F3A] text-sm rounded-full font-medium">
              AI Curated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
