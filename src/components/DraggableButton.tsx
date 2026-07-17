/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface DraggableButtonProps {
  id: string;
  icon: string;
  label: string;
  tooltipText: string;
  isActive: boolean;
  onToggle: () => void;
  defaultTop: number;
  defaultRight: number;
}

export default function DraggableButton({
  id,
  icon,
  label,
  tooltipText,
  isActive,
  onToggle,
  defaultTop,
  defaultRight
}: DraggableButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Track element coordinates
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const [isRotating, setIsRotating] = useState(false);

  // Initialize coordinate positions safely inside viewport
  useEffect(() => {
    const saved = localStorage.getItem(`bts_btn_pos_${id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Verify saved coordinates are within current screen boundaries
          const maxX = window.innerWidth - (window.innerWidth > 768 ? 48 : 42) - 10;
          const maxY = window.innerHeight - (window.innerWidth > 768 ? 48 : 42) - 10;
          const clampedX = Math.max(10, Math.min(maxX, parsed.x));
          const clampedY = Math.max(10, Math.min(maxY, parsed.y));
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      } catch (err) {
        // Safe failover to default values
      }
    }

    // Default positioning in upper right corners
    const btnSize = window.innerWidth > 768 ? 48 : 42;
    const initialX = window.innerWidth - btnSize - defaultRight;
    const initialY = defaultTop;
    setPosition({ x: initialX, y: initialY });
  }, [id, defaultTop, defaultRight]);

  // Keep buttons inside boundaries during viewport resizes
  useEffect(() => {
    const handleResize = () => {
      if (!position) return;
      const btnSize = window.innerWidth > 768 ? 48 : 42;
      const maxX = window.innerWidth - btnSize - 10;
      const maxY = window.innerHeight - btnSize - 10;
      
      const newX = Math.max(10, Math.min(maxX, position.x));
      const newY = Math.max(10, Math.min(maxY, position.y));

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Handle Dragging via Mouse Event Bindings
  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging on right-clicks
    if (e.button !== 0) return;
    if (!position) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
    setIsDragging(true);
    hasMovedRef.current = false;
    
    e.preventDefault();
  };

  // Handle Dragging via Touch Event Bindings for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!position) return;
    const touch = e.touches[0];
    
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    initialPosRef.current = { ...position };
    setIsDragging(true);
    hasMovedRef.current = false;
  };

  useEffect(() => {
    if (!isDragging) return;

    const btnSize = window.innerWidth > 768 ? 48 : 42;
    const maxX = window.innerWidth - btnSize - 10;
    const maxY = window.innerHeight - btnSize - 10;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = Math.max(10, Math.min(maxX, initialPosRef.current.x + dx));
      const nextY = Math.max(10, Math.min(maxY, initialPosRef.current.y + dy));
      
      setPosition({ x: nextX, y: nextY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = Math.max(10, Math.min(maxX, initialPosRef.current.x + dx));
      const nextY = Math.max(10, Math.min(maxY, initialPosRef.current.y + dy));
      
      setPosition({ x: nextX, y: nextY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      if (position) {
        localStorage.setItem(`bts_btn_pos_${id}`, JSON.stringify(position));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, id, position]);

  const handlePointerUpAction = (e: React.MouseEvent | React.TouchEvent) => {
    // If the movement distance was minimal, consider it an intentional quick click toggle
    if (!hasMovedRef.current) {
      setIsRotating(true);
      onToggle();
      setTimeout(() => {
        setIsRotating(false);
      }, 550);
    }
  };

  if (!position) return null;

  return (
    <div
      className="fixed z-[60] select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
    >
      <div className="relative group">
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onMouseUp={handlePointerUpAction}
          onTouchEnd={handlePointerUpAction}
          className={`w-[42px] h-[42px] md:w-12 md:h-12 rounded-full flex items-center justify-center border text-lg md:text-xl font-sans cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl ${
            isDragging ? 'scale-105 opacity-80' : ''
          } ${
            isActive
              ? 'bg-purple-950/45 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.65)] backdrop-blur-lg animate-[pulse_3s_infinite]'
              : 'bg-black/45 hover:bg-black/70 border-white/10 text-slate-400 hover:text-white backdrop-blur-md'
          }`}
          style={{
            transform: isRotating ? 'rotate(360deg)' : undefined,
            transition: isRotating ? 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)' : 'transform 150ms ease-out, shadow 150ms ease-out'
          }}
          aria-label={label}
          title={tooltipText}
        >
          {icon}
        </button>

        {/* Custom Glassmorphism micro-indicator tooltips */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[115%] px-2.5 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-mono text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-2xl z-[70]">
          {tooltipText}
        </div>
      </div>
    </div>
  );
}
