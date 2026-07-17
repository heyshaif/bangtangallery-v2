/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

interface AuroraBackgroundProps {
  theme?: 'dark' | 'light' | 'system';
  isAmbientActive?: boolean;
}

export default function AuroraBackground({ theme = 'dark', isAmbientActive = true }: AuroraBackgroundProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAmbientActive) {
      setParticles([]);
      return;
    }

    // Generate organic floating particles
    const initialParticles = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x
      y: Math.random() * 100, // percentage y
      size: Math.random() * 6 + 2, // px size
      duration: Math.random() * 20 + 15, // seconds animation
      delay: Math.random() * -20 // start immediately at random frame
    }));
    setParticles(initialParticles);

    // Global click listener to trigger immersive visual click ripples
    const handleGlobalClick = (e: MouseEvent) => {
      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples(prev => [...prev, newRipple].slice(-8)); // keep last 8 for smooth rendering
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isAmbientActive]);

  // Soft elastic trailing lag for background custom cursor following
  useEffect(() => {
    if (!isAmbientActive) return;

    let animationFrameId: number;
    const updateTrail = () => {
      setTrailPos(prev => {
        if (prev.x === -100 && mousePos.x !== -100) {
          return mousePos;
        }
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        return {
          x: prev.x + dx * 0.14,
          y: prev.y + dy * 0.14
        };
      });
      animationFrameId = requestAnimationFrame(updateTrail);
    };
    animationFrameId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePos, isAmbientActive]);

  return (
    <div ref={bgRef} className={`fixed inset-0 -z-50 overflow-hidden transition-all duration-750 ${
      theme === 'light' ? 'bg-[#f4edf8]' : 'bg-[#05000a]'
    }`}>
      
      {/* Immersive low-opacity custom trailing cursor halo background glow */}
      {isAmbientActive && (
        <>
          <div 
            className="fixed w-28 h-28 rounded-full pointer-events-none select-none z-50 mix-blend-screen opacity-25"
            style={{
              left: `${trailPos.x}px`,
              top: `${trailPos.y}px`,
              transform: 'translate(-50%, -50%)',
              background: theme === 'light' 
                ? 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)' 
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, transparent 70%)',
            }}
          />
          {/* Sharp minimal inner dot */}
          <div 
            className="fixed w-1.5 h-1.5 rounded-full pointer-events-none select-none z-50 bg-purple-500 opacity-40"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </>
      )}
      
      {/* Symmetrical Premium BTS Doors Logo watermark in the background with low-opacity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <svg viewBox="0 0 100 100" className={`w-64 h-64 md:w-[480px] md:h-[480px] select-none transition-all duration-1000 ${
          theme === 'light' 
            ? 'text-purple-900 opacity-[0.03]' 
            : isAmbientActive 
              ? 'text-purple-600 opacity-[0.04]' 
              : 'text-purple-600 opacity-[0.02]'
        }`}>
          <path d="M 22,22 L 44,27 L 44,73 L 22,78 Z" fill="currentColor" />
          <path d="M 78,22 L 56,27 L 56,73 L 78,78 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Animated gradient blobs matching the Immersive UI design theme */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isAmbientActive ? 'opacity-40' : 'opacity-10'}`}>
        <div className={`absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[120px] ${isAmbientActive ? 'animate-pulse' : ''}`} style={{ animationDuration: '14s' }} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px] ${isAmbientActive ? 'animate-pulse' : ''}`} style={{ animationDuration: '18s', animationDelay: '3s' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Floating Sparkles & Particles */}
      {isAmbientActive && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-purple-400 opacity-35 filter blur-[0.5px]"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `float-particle ${p.duration}s infinite linear`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Dynamic expanding Click Ripples elements */}
      {isAmbientActive && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {ripples.map((rip) => (
            <div
              key={rip.id}
              className="absolute rounded-full border border-purple-500/25 bg-purple-500/5 animate-ripple pointer-events-none"
              style={{
                left: `${rip.x}px`,
                top: `${rip.y}px`,
                width: '80px',
                height: '80px',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      )}

      {/* Embedded CSS for custom floating nebulas, particles and expanding ripple wave */}
      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-5%, 8%) scale(1.1);
          }
        }
        @keyframes float-particle {
          0% {
            transform: translateY(100vh) translateX(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-20vh) translateX(50px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes ripple-expand {
          0% {
            transform: translate(-50%, -50%) scale(0.1);
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) scale(5);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple-expand 1.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
