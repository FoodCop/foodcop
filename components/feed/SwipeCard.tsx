import { Bookmark, Bot, Heart, MapPin, Share2, Verified } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { SafeRestaurantImage } from "../ui/SafeRestaurantImage";

interface SwipeCardProps {
  image: string;
  title: string;
  subtitle: string;
  profileName: string;
  profileDesignation: string;
  tags: string[];
  onSwipe: (direction: "left" | "right") => void;
  isActive: boolean;
  isMasterBot?: boolean;
  botData?: {
    username: string;
    specialties: string[];
    location?: string;
  };
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
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? "right" : "left");
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
    if (Math.abs(dragOffset.x) < 50) return null;

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

        {/* Profile Info - Top Left */}
        <div className="absolute top-6 left-6 flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-[#F14C35] rounded-full flex items-center justify-center">
              {isMasterBot ? (
                <Bot className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white font-bold">T</span>
              )}
            </div>
            {isMasterBot && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD74A] rounded-full flex items-center justify-center border-2 border-white">
                <Verified className="w-2.5 h-2.5 text-[#0B1F3A]" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <p className="text-white font-semibold text-sm">{profileName}</p>
              {isMasterBot && (
                <span className="px-2 py-0.5 bg-[#FFD74A]/90 text-[#0B1F3A] rounded-full text-xs font-medium">
                  Master Explorer
                </span>
              )}
            </div>
            <p className="text-white/80 text-xs">{profileDesignation}</p>
            {isMasterBot && botData?.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPin className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-xs">
                  {botData.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Icons - Right Side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
          {[
            { icon: Heart, color: "text-pink-400", bg: "bg-white/20" },
            { icon: Bookmark, color: "text-yellow-400", bg: "bg-white/20" },
            { icon: Share2, color: "text-blue-400", bg: "bg-white/20" },
            { icon: MapPin, color: "text-green-400", bg: "bg-white/20" },
          ].map((item, index) => (
            <button
              key={index}
              className={`w-12 h-12 ${item.bg} backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors`}
              onClick={(e) => e.stopPropagation()}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </button>
          ))}
        </div>

        {/* Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white text-[20px]">
              {title}
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">{subtitle}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`px-3 py-1 backdrop-blur-sm text-white text-sm rounded-full border ${
                  isMasterBot
                    ? "bg-[#F14C35]/30 border-[#F14C35]/50"
                    : "bg-white/20 border-white/30"
                }`}
              >
                #{tag}
              </span>
            ))}
            {isMasterBot && botData?.specialties && (
              <span className="px-3 py-1 bg-[#FFD74A]/90 text-[#0B1F3A] text-sm rounded-full font-medium">
                AI Curated
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
