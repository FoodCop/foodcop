// Performance Optimization Component
// Virtual scrolling, lazy loading, and memory management for large chat histories

'use client';

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  memo,
  useLayoutEffect
} from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown,
  Loader2,
  ArrowDown,
  Image,
  Play,
  FileText
} from 'lucide-react';

// Virtual scrolling interfaces
interface VirtualItem {
  id: string;
  index: number;
  height: number;
  offset: number;
  data: any;
}

interface VirtualScrollerProps {
  items: any[];
  itemHeight: number | ((index: number, item: any) => number);
  containerHeight: number;
  overscan?: number;
  renderItem: (item: any, index: number, style: React.CSSProperties) => React.ReactNode;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  className?: string;
}

// Virtual scrolling hook
const useVirtualScroller = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: Omit<VirtualScrollerProps, 'renderItem' | 'className'>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate item positions
  const itemData = useMemo(() => {
    const virtualItems: VirtualItem[] = [];
    let totalHeight = 0;

    items.forEach((item, index) => {
      const height = typeof itemHeight === 'function' ? itemHeight(index, item) : itemHeight;
      
      virtualItems.push({
        id: item.id || index.toString(),
        index,
        height,
        offset: totalHeight,
        data: item
      });
      
      totalHeight += height;
    });

    return { virtualItems, totalHeight };
  }, [items, itemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const { virtualItems } = itemData;
    
    const startIndex = Math.max(
      0,
      virtualItems.findIndex(item => item.offset + item.height > scrollTop) - overscan
    );
    
    const endIndex = Math.min(
      virtualItems.length - 1,
      virtualItems.findIndex(item => item.offset > scrollTop + containerHeight) + overscan
    );

    return {
      startIndex: startIndex === -1 ? 0 : startIndex,
      endIndex: endIndex === -1 ? virtualItems.length - 1 : endIndex
    };
  }, [itemData, scrollTop, containerHeight, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { virtualItems } = itemData;
    const { startIndex, endIndex } = visibleRange;
    
    return virtualItems.slice(startIndex, endIndex + 1);
  }, [itemData, visibleRange]);

  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight: itemData.totalHeight,
    handleScroll,
    scrollTop
  };
};

// Memoized virtual scroller component
export const VirtualChatScroller: React.FC<VirtualScrollerProps> = memo(({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  onLoadMore,
  loading = false,
  hasMore = true,
  className
}) => {
  const {
    scrollElementRef,
    visibleItems,
    totalHeight,
    handleScroll
  } = useVirtualScroller({
    items,
    itemHeight,
    containerHeight,
    overscan
  });

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Intersection observer for infinite loading
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loading]);

  // Monitor scroll position for scroll-to-bottom button
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const handleScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      setIsNearBottom(isAtBottom);
      setShowScrollToBottom(!isAtBottom && scrollTop > 500);
    };

    element.addEventListener('scroll', handleScrollPosition);
    return () => element.removeEventListener('scroll', handleScrollPosition);
  }, [scrollElementRef]);

  // Auto-scroll to bottom when new messages arrive (if already at bottom)
  useEffect(() => {
    if (isNearBottom && scrollElementRef.current) {
      scrollElementRef.current.scrollTop = scrollElementRef.current.scrollHeight;
    }
  }, [items.length, isNearBottom, scrollElementRef]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTo({
        top: scrollElementRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [scrollElementRef]);

  return (
    <div className={cn("relative", className)} style={{ height: containerHeight }}>
      {/* Virtual scroller container */}
      <div
        ref={scrollElementRef}
        className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        onScroll={handleScroll}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items */}
          {visibleItems.map((virtualItem) => (
            <div
              key={virtualItem.id}
              style={{
                position: 'absolute',
                top: virtualItem.offset,
                left: 0,
                right: 0,
                height: virtualItem.height
              }}
            >
              {renderItem(
                virtualItem.data,
                virtualItem.index,
                {
                  height: virtualItem.height,
                  width: '100%'
                }
              )}
            </div>
          ))}

          {/* Load more trigger */}
          {hasMore && (
            <div
              ref={loadMoreTriggerRef}
              className="flex justify-center py-4"
              style={{
                position: 'absolute',
                top: totalHeight - 100,
                left: 0,
                right: 0
              }}
            >
              {loading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading more messages...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          size="sm"
          className={cn(
            "absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg",
            "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          )}
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4 text-white" />
        </Button>
      )}
    </div>
  );
});

VirtualChatScroller.displayName = 'VirtualChatScroller';

// Lazy loading image component
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-gray-100", className)}
      style={{ width, height }}
    >
      {isInView ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              {placeholder || (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-8 w-8" />
                  <span className="text-xs">Loading...</span>
                </div>
              )}
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-8 w-8" />
                <span className="text-xs">Failed to load</span>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={handleLoad}
              onError={handleError}
              loading="lazy"
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder || (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-8 w-8" />
              <span className="text-xs">Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// Memory management hook
export const useMemoryOptimization = (maxCachedItems: number = 1000) => {
  const [cachedData, setCachedData] = useState<Map<string, any>>(new Map());
  const [accessOrder, setAccessOrder] = useState<string[]>([]);

  const addToCache = useCallback((key: string, data: any) => {
    setCachedData(prev => {
      const newCache = new Map(prev);
      
      // If cache is full, remove least recently used item
      if (newCache.size >= maxCachedItems) {
        const lruKey = accessOrder[0];
        newCache.delete(lruKey);
        setAccessOrder(order => order.slice(1));
      }
      
      newCache.set(key, data);
      return newCache;
    });
    
    setAccessOrder(prev => [...prev.filter(k => k !== key), key]);
  }, [maxCachedItems, accessOrder]);

  const getFromCache = useCallback((key: string) => {
    const data = cachedData.get(key);
    
    if (data) {
      // Update access order
      setAccessOrder(prev => [...prev.filter(k => k !== key), key]);
    }
    
    return data;
  }, [cachedData]);

  const clearCache = useCallback(() => {
    setCachedData(new Map());
    setAccessOrder([]);
  }, []);

  return {
    addToCache,
    getFromCache,
    clearCache,
    cacheSize: cachedData.size
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    scrollFPS: 0
  });

  const startTimer = useCallback(() => {
    return performance.now();
  }, []);

  const endTimer = useCallback((startTime: number, operation: string) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      renderTime: duration
    }));
    
    console.log(`${operation} took ${duration.toFixed(2)}ms`);
  }, []);

  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize / (1024 * 1024) // MB
      }));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, [measureMemory]);

  return {
    metrics,
    startTimer,
    endTimer,
    measureMemory
  };
};

// Export all performance components
export const PerformanceOptimizations = {
  VirtualChatScroller,
  LazyImage,
  useMemoryOptimization,
  usePerformanceMonitor
};