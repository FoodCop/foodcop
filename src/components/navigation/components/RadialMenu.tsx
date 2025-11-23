import { useState, useRef, useEffect, useCallback } from 'react';

interface MenuItem {
  label: string;
  route: string;
  icon?: React.ReactNode;
}

interface RadialMenuProps {
  readonly items: MenuItem[];
  readonly barrelColor?: string;
  readonly onNavigate: (route: string) => void;
  readonly currentRoute: string;
}

export function RadialMenu({ 
  items, 
  barrelColor: _barrelColor = '#FF6B35',
  onNavigate,
  currentRoute,
}: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 110; // Distance from center to items (10% bigger: 100 * 1.10)
  const itemSize = 62; // 10% bigger: 56 * 1.10 = 61.6
  const centerButtonSize = 70; // 10% bigger: 64 * 1.10 = 70.4
  const containerSize = 308; // 10% bigger: 280 * 1.10 = 308

  // Get current page index from route
  const currentPageIndex = items.findIndex(item => item.route === currentRoute);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const snapToNearest = useCallback((rotation: number) => {
    const anglePerItem = 360 / items.length;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const nearestIndex = Math.round(normalizedRotation / anglePerItem) % items.length;
    const targetRotation = nearestIndex * anglePerItem;
    
    let diff = normalizedRotation - targetRotation;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const snapTarget = rotation - diff;
    setCurrentRotation(snapTarget);
  }, [items.length]);

  const getDistanceFromCenter = (e: MouseEvent | TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return Infinity;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - centerX;
    const y = clientY - centerY;
    return Math.sqrt(x * x + y * y);
  };

  const getAngle = (e: MouseEvent | TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOpen) return;
    const distance = getDistanceFromCenter(e.nativeEvent);
    if (distance < 40) return; // Prevent interaction with center button area
    
    e.preventDefault();
    isDraggingRef.current = true;
    const angle = getAngle(e.nativeEvent);
    lastAngleRef.current = angle;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;
    const distance = getDistanceFromCenter(e.nativeEvent);
    if (distance < 40) return; // Prevent interaction with center button area
    
    e.preventDefault();
    isDraggingRef.current = true;
    const angle = getAngle(e.nativeEvent);
    lastAngleRef.current = angle;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !isOpen) return;
      
      const angle = getAngle(e);
      let delta = angle - lastAngleRef.current;
      
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      setCurrentRotation(prev => prev + delta);
      lastAngleRef.current = angle;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !isOpen) return;
      
      const angle = getAngle(e);
      let delta = angle - lastAngleRef.current;
      
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      setCurrentRotation(prev => prev + delta);
      lastAngleRef.current = angle;
    };

    const handleDragEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        snapToNearest(currentRotation);
      }
    };

    if (isOpen) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleDragEnd);
      globalThis.addEventListener('touchmove', handleTouchMove);
      globalThis.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleDragEnd);
      globalThis.removeEventListener('touchmove', handleTouchMove);
      globalThis.removeEventListener('touchend', handleDragEnd);
    };
  }, [isOpen, currentRotation, snapToNearest]);

  const handleItemClick = (index: number) => {
    if (!isOpen) return;
    const item = items[index];
    onNavigate(item.route);
    setIsOpen(false);
  };

  const handleBarrelClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setCurrentRotation(0);
    }
  };

  // Calculate item positions
  const getItemPosition = (index: number) => {
    const baseAngle = (360 / items.length) * index - 90;
    const adjustedAngle = (baseAngle - currentRotation) * (Math.PI / 180);
    const x = Math.cos(adjustedAngle) * radius;
    const y = Math.sin(adjustedAngle) * radius;
    return { x, y };
  };

  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 z-50" style={{ bottom: '-80px' }}>
      {/* Menu Container */}
      <div 
        className="relative" 
        ref={containerRef}
        style={{ 
          width: containerSize, 
          height: containerSize,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Menu Items Ring */}
        {isOpen && (
          <div
            className="absolute left-1/2 top-1/2"
            style={{ 
              width: radius * 2 + itemSize,
              height: radius * 2 + itemSize,
              marginLeft: -(radius + itemSize / 2),
              marginTop: -(radius + itemSize / 2),
              cursor: isDraggingRef.current ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {items.map((item, index) => {
              const { x, y } = getItemPosition(index);
              const isSelected = currentPageIndex === index;
              
              return (
                <div
                  key={`radial-item-${item.route}-${index}`}
                  className={`barrel-item absolute left-1/2 top-1/2 ${isSelected ? 'selected' : ''}`}
                  style={{
                    width: itemSize,
                    height: itemSize,
                    marginLeft: -itemSize / 2,
                    marginTop: -itemSize / 2,
                    transform: `translate(${x}px, ${y}px) scale(${isOpen ? 1 : 0})`,
                    opacity: isOpen ? 1 : 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: isOpen ? 'all' : 'none',
                  }}
                >
                  <button
                    className="w-full h-full rounded-full bg-white border-2 flex items-center justify-center transition-all active:scale-90"
                    style={{
                      borderColor: isSelected ? '#FF6B35' : '#EEE',
                      backgroundColor: isSelected ? '#FF6B35' : '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      color: isSelected ? '#FFFFFF' : '#374151',
                    }}
                    onClick={() => handleItemClick(index)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {item.icon && (
                      <div style={{ 
                        color: isSelected ? '#FFFFFF' : '#374151',
                        transition: 'color 0.2s ease',
                      }}>
                        {item.icon}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Center Button */}
        <button
          className="center-button absolute left-1/2 top-1/2 rounded-full bg-white border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          style={{
            width: centerButtonSize,
            height: centerButtonSize,
            marginLeft: -centerButtonSize / 2,
            marginTop: -centerButtonSize / 2,
            borderColor: '#EEE',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onClick={handleBarrelClick}
        >
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              transform: `rotate(${isOpen ? 90 : 0}deg)`,
              transition: 'transform 0.3s ease',
            }}
          >
            <img 
              src="/logo_white.png"
              alt="FUZO"
              className="w-full h-full object-contain"
            />
          </div>
        </button>
      </div>
    </div>
  );
}
