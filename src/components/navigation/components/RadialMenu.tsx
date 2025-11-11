import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface MenuItem {
  label: string;
  route: string;
  icon?: React.ReactNode;
}

interface RadialMenuProps {
  items: MenuItem[];
  barrelColor?: string;
  onNavigate: (route: string) => void;
  currentRoute: string;
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

  const radius = 100; // Distance from center to items
  const itemSize = 56;

  // Get current page index from route
  const currentPageIndex = items.findIndex(item => item.route === currentRoute);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Restore original overflow when menu closes
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
    
    // Calculate the difference
    let diff = normalizedRotation - targetRotation;
    
    // Choose shortest path
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const snapTarget = rotation - diff;
    setCurrentRotation(snapTarget);
  }, [items.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isOpen) return;
    e.preventDefault();
    isDraggingRef.current = true;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    lastAngleRef.current = angle;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isOpen) return;
    e.preventDefault();
    isDraggingRef.current = true;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
    lastAngleRef.current = angle;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      
      let delta = angle - lastAngleRef.current;
      
      // Handle wraparound
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      setCurrentRotation(prev => prev + delta);
      lastAngleRef.current = angle;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
      
      let delta = angle - lastAngleRef.current;
      
      // Handle wraparound
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      setCurrentRotation(prev => prev + delta);
      lastAngleRef.current = angle;
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        snapToNearest(currentRotation);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        snapToNearest(currentRotation);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [items.length, currentRotation, snapToNearest]);

  const handleItemClick = (index: number) => {
    const item = items[index];
    onNavigate(item.route);
    setIsOpen(false);
  };

  const handleBarrelClick = () => {
    if (isOpen) {
      // If open, just close the menu
      setIsOpen(false);
    } else {
      // If closed, open the menu
      setIsOpen(true);
      setCurrentRotation(0);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 -z-10"
            style={{ bottom: '0', right: '0', left: '0', top: '0' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Container */}
      <div 
        className="relative" 
        ref={containerRef}
        style={{ width: 80, height: 80 }}
      >
        {/* Menu Items Ring */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{ 
                width: radius * 2 + itemSize,
                height: radius * 2 + itemSize,
                marginLeft: -(radius + itemSize / 2),
                marginTop: -(radius + itemSize / 2),
                cursor: isDraggingRef.current ? 'grabbing' : 'grab',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {items.map((item, index) => {
                // Calculate position - start at top and go clockwise
                const baseAngle = (360 / items.length) * index - 90;
                const adjustedAngle = (baseAngle - currentRotation) * (Math.PI / 180);
                const x = Math.cos(adjustedAngle) * radius;
                const y = Math.sin(adjustedAngle) * radius;
                
                return (
                  <motion.div
                    key={index}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: itemSize,
                      height: itemSize,
                      marginLeft: -itemSize / 2,
                      marginTop: -itemSize / 2,
                    }}
                    animate={{
                      x: x,
                      y: y,
                    }}
                    transition={{
                      type: isDraggingRef.current ? 'tween' : 'spring',
                      duration: isDraggingRef.current ? 0 : 0.3,
                      stiffness: 300,
                      damping: 25,
                    }}
                  >
                    <motion.button
                      className="w-full h-full rounded-full shadow-lg transition-all relative overflow-hidden backdrop-blur-md"
                      style={{
                        background: currentPageIndex === index 
                          ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.9) 0%, rgba(255, 140, 66, 0.9) 100%)'
                          : 'rgba(255, 255, 255, 0.2)',
                        border: currentPageIndex === index 
                          ? '2px solid rgba(255, 107, 53, 0.8)' 
                          : '2px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: currentPageIndex === index
                          ? '0 8px 32px rgba(255, 107, 53, 0.3)'
                          : '0 4px 16px rgba(0, 0, 0, 0.1)',
                        color: currentPageIndex === index ? 'white' : '#374151',
                      }}
                      onClick={() => handleItemClick(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{
                        scale: currentPageIndex === index ? 1.15 : 1,
                        rotate: -currentRotation,
                      }}
                      transition={{
                        scale: { type: 'spring', stiffness: 300, damping: 20 },
                        rotate: { 
                          type: isDraggingRef.current ? 'tween' : 'spring',
                          duration: isDraggingRef.current ? 0 : 0.3,
                          stiffness: 300,
                          damping: 25,
                        },
                      }}
                    >
                      {/* Glass effect overlay */}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
                          opacity: currentPageIndex === index ? 0.3 : 0.6,
                        }}
                      />
                      <div className="relative flex flex-col items-center justify-center h-full px-1">
                        {item.icon && (
                          <div className="mb-0.5">{item.icon}</div>
                        )}
                        <span className="text-xs text-center leading-tight">
                          {item.label}
                        </span>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Connecting lines */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                <g
                  style={{
                    transform: `rotate(${currentRotation}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  {items.map((_, index) => {
                    const angle = (360 / items.length) * index - 90;
                    const angleInRadians = (angle * Math.PI) / 180;
                    const x = Math.cos(angleInRadians) * radius + radius + itemSize / 2;
                    const y = Math.sin(angleInRadians) * radius + radius + itemSize / 2;
                    const centerX = radius + itemSize / 2;
                    const centerY = radius + itemSize / 2;

                    return (
                      <line
                        key={index}
                        x1={centerX}
                        y1={centerY}
                        x2={x}
                        y2={y}
                        stroke={currentPageIndex === index ? '#FF6B35' : 'rgba(255, 255, 255, 0.3)'}
                        strokeWidth={currentPageIndex === index ? '3' : '2'}
                        strokeDasharray="4 4"
                        opacity={0.4}
                        style={{
                          transition: 'stroke 0.3s, stroke-width 0.3s',
                        }}
                      />
                    );
                  })}
                </g>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barrel Button */}
        <motion.button
          className="relative rounded-full shadow-2xl overflow-hidden w-full h-full"
          style={{
            background: `linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFA556 100%)`,
            border: 'none',
            boxShadow: '0 8px 32px rgba(255, 107, 53, 0.4)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBarrelClick}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <motion.div
              initial={false}
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                currentPageIndex >= 0 && items[currentPageIndex]?.icon ? (
                  <div className="scale-150">{items[currentPageIndex].icon}</div>
                ) : (
                  <X size={32} />
                )
              ) : (
                currentPageIndex >= 0 && items[currentPageIndex]?.icon ? (
                  <div className="scale-150">{items[currentPageIndex].icon}</div>
                ) : (
                  <Menu size={32} />
                )
              )}
            </motion.div>
          </div>

          {/* Shine effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 60%)',
            }}
          />
        </motion.button>

        {/* Instruction hint */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap pointer-events-none text-center"
          >
            Click any option to navigate
          </motion.div>
        )}
      </div>
    </div>
  );
}
