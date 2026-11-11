/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

// Color palette for modern premium BTS hearts & sparks
const PURPLE_COLORS = [
  '#A78BFA', // Violet light
  '#C084FC', // Faint purple
  '#F472B6', // Pink highlight
  '#818CF8', // Indigo
  '#D8B4FE', // Pale violet
  '#EC4899', // True pink
  '#8B5CF6'  // Deep purple
];

// Vibrant multi-color palette for celebration fireworks mode
const SHINY_FIREWORK_COLORS = [
  '#FF3366', // Fire pink
  '#33CCFF', // Electric blue
  '#FFB81C', // Vibrant gold / butter
  '#39FF14', // Neon lime
  '#9333EA', // Orchid violet
  '#F43F5E', // Deep rose
  '#F59E0B', // Amber
  '#10B981'  // Emerald
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  type: 'heart' | 'sparkle' | 'spark' | 'dust';
  rotation?: number;
  rotSpeed?: number;
  bounce?: number;
}

interface Firework {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  isActive: boolean;
  color: string;
}

interface PurpleLoveOverlayProps {
  isPurpleLove: boolean;
  isFireworks: boolean;
}

export default function PurpleLoveOverlay({ isPurpleLove, isFireworks }: PurpleLoveOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio synthesizer for firework pops and sparkly crackles
  const playSynthesizedExplosion = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Sound 1: Soft low-frequency boom (Bass)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.65);

      gain1.gain.setValueAtTime(0.22, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

      // Sound 2: High texture sizzle sound
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(950, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.3);

      gain2.gain.setValueAtTime(0.045, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.start();
      osc1.stop(ctx.currentTime + 0.66);

      osc2.start();
      osc2.stop(ctx.currentTime + 0.31);
    } catch (err) {
      // Browsers often block initial autoplay without gesture, which is completely expected and handled
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let fireworks: Firework[] = [];

    // Match high DPI configurations
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Canvas rendering shapes
    const drawHeartShape = (context: CanvasRenderingContext2D, x: number, y: number, sz: number) => {
      context.beginPath();
      const d = sz;
      context.moveTo(x, y + d / 4);
      context.quadraticCurveTo(x, y, x - d / 2, y);
      context.quadraticCurveTo(x - d, y, x - d, y + d / 3);
      context.quadraticCurveTo(x - d, y + (d * 2) / 3, x, y + d);
      context.quadraticCurveTo(x + d, y + (d * 2) / 3, x + d, y + d / 3);
      context.quadraticCurveTo(x + d, y, x + d / 2, y);
      context.quadraticCurveTo(x, y, x, y + d / 4);
      context.closePath();
    };

    const drawSparkleShape = (context: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      context.beginPath();
      context.moveTo(x, y - r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.quadraticCurveTo(x, y, x, y + r);
      context.quadraticCurveTo(x, y, x - r, y);
      context.quadraticCurveTo(x, y, x, y - r);
      context.closePath();
    };

    // Pre-populate original slow purple floating hearts if enabled right away
    if (isPurpleLove) {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight + window.innerHeight * 0.15,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.7 - Math.random() * 1.6,
          size: Math.random() * 16 + 10,
          alpha: Math.random() * 0.35 + 0.45,
          decay: 0.0014 + Math.random() * 0.002,
          color: PURPLE_COLORS[Math.floor(Math.random() * PURPLE_COLORS.length)],
          type: 'heart',
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.02
        });
      }
    }

    let lastFireworkSpawn = Date.now() - 2500; // spawn slightly quicker right off

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // 1. Spawning Mechanics
      // Hearts spawning (Only if isPurpleLove is true)
      if (isPurpleLove && particles.filter(p => p.type === 'heart' || p.type === 'sparkle').length < 85) {
        if (Math.random() < 0.14) {
          particles.push({
            x: Math.random() * W,
            y: H + 30, // upward from bottom of page
            vx: (Math.random() - 0.5) * 1.3,
            vy: -0.9 - Math.random() * 1.9,
            size: Math.random() * 15 + 10,
            alpha: Math.random() * 0.4 + 0.55,
            decay: 0.0012 + Math.random() * 0.0017,
            color: PURPLE_COLORS[Math.floor(Math.random() * PURPLE_COLORS.length)],
            type: Math.random() > 0.3 ? 'heart' : 'sparkle',
            rotation: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.025
          });
        }
      }

      // Fireworks spawning (Only if isFireworks is true)
      if (isFireworks) {
        const now = Date.now();
        // Spawns a beautiful glowing celebration rocket every 3.2 - 5 seconds
        if (now - lastFireworkSpawn > 3200 + Math.random() * 1800) {
          lastFireworkSpawn = now;
          fireworks.push({
            x: W * 0.12 + Math.random() * W * 0.76,
            y: H + 10,
            targetY: H * 0.1 + Math.random() * H * 0.48,
            vx: (Math.random() - 0.5) * 3.5,
            vy: -8.5 - Math.random() * 6.5,
            isActive: true,
            color: SHINY_FIREWORK_COLORS[Math.floor(Math.random() * SHINY_FIREWORK_COLORS.length)]
          });
        }
      }

      // 2. Process & Draw Active Fireworks (Only if isFireworks or sparks remain)
      fireworks.forEach((fw) => {
        if (!fw.isActive) return;

        // Render launching rocket head with intense light trails
        ctx.shadowBlur = 15;
        ctx.shadowColor = fw.color;
        ctx.fillStyle = fw.color;

        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail smoke/particulate
        if (Math.random() < 0.65) {
          particles.push({
            x: fw.x,
            y: fw.y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 1.2 + Math.random() * 1.2,
            size: Math.random() * 3 + 1,
            alpha: 0.85,
            decay: 0.025 + Math.random() * 0.025,
            color: '#FFFFFF',
            type: 'dust'
          });
        }

        // Apply motion vectors
        fw.x += fw.vx;
        fw.y += fw.vy;

        // Peak target reached event -> EXPLODE!
        if (fw.vy >= 0 || fw.y <= fw.targetY) {
          fw.isActive = false;
          playSynthesizedExplosion();

          // Generate detailed sparks inside firework
          const sparkCount = 40 + Math.floor(Math.random() * 25);
          for (let s = 0; s < sparkCount; s++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2.8 + Math.random() * 6.0;
            
            particles.push({
              x: fw.x,
              y: fw.y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              size: Math.random() * 5 + 3,
              alpha: 1.0,
              decay: 0.012 + Math.random() * 0.016,
              color: s % 3 === 0 ? '#FFFFFF' : fw.color,
              type: 'spark',
              bounce: 0.1 + Math.random() * 0.1
            });
          }

          // If Purple Love is ALSO active, embed extra cute hearts from the explosion!
          if (isPurpleLove) {
            for (let h = 0; h < 5; h++) {
              particles.push({
                x: fw.x + (Math.random() - 0.5) * 30,
                y: fw.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -0.6 - Math.random() * 1.5,
                size: Math.random() * 12 + 10,
                alpha: 0.9,
                decay: 0.006 + Math.random() * 0.006,
                color: PURPLE_COLORS[Math.floor(Math.random() * PURPLE_COLORS.length)],
                type: 'heart'
              });
            }
          }
        }
      });

      // Maintain fireworks list
      fireworks = fireworks.filter(f => f.isActive);

      // 3. Process & Render Particles
      particles.forEach((p) => {
        ctx.shadowBlur = p.type === 'spark' ? 12 : 0;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'heart') {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          drawHeartShape(ctx, 0, 0, p.size);
          ctx.fill();
        } else if (p.type === 'sparkle') {
          ctx.translate(p.x, p.y);
          if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
          }
          drawSparkleShape(ctx, 0, 0, p.size / 2);
          ctx.fill();
        } else if (p.type === 'spark') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // dust trail
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 4. Update coordinates & decay rates
        p.alpha -= p.decay;

        if (p.type === 'heart' || p.type === 'sparkle') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.rotation !== undefined && p.rotSpeed !== undefined) {
            p.rotation += p.rotSpeed;
          }
          // Fluid wavy motion logic
          p.vx += Math.sin(Date.now() / 650 + p.size) * 0.035;

          // Cute microburst effects on fading hearts
          if (p.alpha > 0.16 && p.alpha < 0.21 && Math.random() < 0.04) {
            p.alpha = 0; // terminate parent
            const burstCount = 5 + Math.floor(Math.random() * 6);
            for (let m = 0; m < burstCount; m++) {
              particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 2.8,
                vy: (Math.random() - 0.5) * 2.8,
                size: Math.random() * 2.8 + 1.2,
                alpha: 0.85,
                decay: 0.02 + Math.random() * 0.025,
                color: p.color,
                type: 'dust'
              });
            }
          }
        } else if (p.type === 'spark') {
          // Newtonian physics models for fireworks blasts
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.09; // smooth gravity pulls sparks downward
          p.vx *= 0.982; // momentum drag/frictional deceleration
          p.vy *= 0.982;
        } else {
          // Standard dust settling path
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.01;
        }
      });

      // Filter off-screen or faded instances
      particles = particles.filter(p => p.alpha > 0 && p.y > -50 && p.x > -50 && p.x < W + 50);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isPurpleLove, isFireworks]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none select-none z-[48]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
