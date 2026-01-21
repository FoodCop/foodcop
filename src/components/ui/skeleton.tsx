/**
 * Skeleton Component
 *
 * Loading placeholder for content that's being fetched.
 * Uses design tokens for consistent animations and colors.
 */

import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800",
        className
      )}
      {...props}
    />
  );
}

/**
 * Feed Card Skeleton
 * Matches the dimensions of FeedMobile cards
 */
function FeedCardSkeleton() {
  return (
    <div className="w-full max-w-[335px] h-[540px] bg-white dark:bg-neutral-900 rounded-card shadow-card overflow-hidden">
      {/* Card Image Skeleton */}
      <div className="relative aspect-[9/16]">
        <Skeleton className="w-full h-full" />

        {/* Text Overlay Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
          <Skeleton className="h-7 w-3/4 bg-white/20 dark:bg-black/20" />  {/* Title */}
          <Skeleton className="h-4 w-1/2 bg-white/20 dark:bg-black/20" />  {/* Subtitle */}
        </div>

        {/* Platform Badge Skeleton */}
        <div className="absolute bottom-3 right-3">
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Bites Card Skeleton (Masonry Grid)
 * Variable height for masonry layout
 */
function BitesCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-neutral-900 rounded-card shadow-card overflow-hidden", className)}>
      <Skeleton className="w-full h-48" />  {/* Image */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />  {/* Title */}
        <Skeleton className="h-4 w-full" />  {/* Description line 1 */}
        <Skeleton className="h-4 w-2/3" />  {/* Description line 2 */}
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />  {/* Badge 1 */}
          <Skeleton className="h-6 w-16 rounded-full" />  {/* Badge 2 */}
        </div>
      </div>
    </div>
  );
}

/**
 * Scout Restaurant Card Skeleton
 */
function ScoutCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-card shadow-card p-4 space-y-3">
      <Skeleton className="w-full h-40 rounded-lg" />  {/* Restaurant Image */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />  {/* Name */}
        <Skeleton className="h-4 w-1/2" />  {/* Cuisine */}
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />  {/* Rating */}
          <Skeleton className="h-4 w-20" />  {/* Distance */}
        </div>
      </div>
    </div>
  );
}

/**
 * List Item Skeleton (Chat, Comments, etc.)
 */
function ListItemSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />  {/* Avatar */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />  {/* Name */}
        <Skeleton className="h-3 w-full" />  {/* Content line 1 */}
        <Skeleton className="h-3 w-3/4" />  {/* Content line 2 */}
      </div>
    </div>
  );
}

/**
 * Button Skeleton
 */
function ButtonSkeleton({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const heights = {
    sm: "h-8",
    default: "h-11",
    lg: "h-14",
  };

  return (
    <Skeleton className={cn(heights[size], "w-32 rounded-button")} />
  );
}

/**
 * Text Skeleton
 * For individual lines of text
 */
function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export {
  Skeleton,
  FeedCardSkeleton,
  BitesCardSkeleton,
  ScoutCardSkeleton,
  ListItemSkeleton,
  ButtonSkeleton,
  TextSkeleton,
};
