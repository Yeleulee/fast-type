import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  opacity: number;
  rotation: number;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  amount?: number;
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  isDark?: boolean;
}

export function ParticleEffect({
  x,
  y,
  amount = 10,
  duration = 1.2,
  onComplete,
  colors = ['#9ece6a', '#f7768e', '#7aa2f7', '#bb9af7'],
  isDark = false
}: ParticleEffectProps) {
  const defaultColors = isDark 
    ? ['#9ece6a', '#f7768e', '#7aa2f7', '#bb9af7', '#e0af68'] 
    : ['#a855f7', '#ec4899', '#3b82f6', '#f97316', '#facc15'];
  
  const particleColors = colors.length > 0 ? colors : defaultColors;
  
  // Generate random particles
  const particles: Particle[] = Array.from({ length: amount }).map((_, i) => ({
    id: i,
    x: 0,
    y: 0,
    size: Math.random() * 8 + 4,
    color: particleColors[Math.floor(Math.random() * particleColors.length)],
    speed: Math.random() * 100 + 50,
    angle: Math.random() * Math.PI * 2,
    opacity: 1,
    rotation: Math.random() * 360
  }));

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ top: y, left: x }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            x: 0,
            y: 0,
            rotate: 0
          }}
          animate={{
            x: Math.cos(particle.angle) * particle.speed,
            y: Math.sin(particle.angle) * particle.speed,
            opacity: [1, 0.8, 0],
            scale: [1, 0.8, 0.5],
            rotate: particle.rotation
          }}
          transition={{
            duration: duration * (0.7 + Math.random() * 0.6),
            ease: [0.32, 0.72, 0, 1]
          }}
          onAnimationComplete={() => {
            if (particle.id === particles.length - 1 && onComplete) {
              onComplete();
            }
          }}
        />
      ))}
    </div>
  );
}

interface ParticleSystemProps {
  enabled?: boolean;
  isDark?: boolean;
}

export function ParticleSystem({ enabled = true, isDark = false }: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = React.useState<
    Array<{
      id: number;
      x: number;
      y: number;
      createdAt: number;
    }>
  >([]);

  // Track mouse position for particle creation
  useEffect(() => {
    if (!enabled) return;
    
    let timeout: NodeJS.Timeout;
    let mouseX = 0;
    let mouseY = 0;
    let lastParticleTime = 0;
    const PARTICLE_INTERVAL = 200; // ms between particle bursts
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      const now = Date.now();
      if (now - lastParticleTime > PARTICLE_INTERVAL) {
        lastParticleTime = now;
        
        // Create new particle at current mouse position
        setParticles(prev => [
          ...prev,
          { 
            id: now, 
            x: mouseX, 
            y: mouseY, 
            createdAt: now 
          }
        ]);
        
        // Cleanup old particles after 2 seconds
        timeout = setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== now));
        }, 2000);
      }
    };
    
    // Handle key presses to generate particles
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA') {
        const textArea = document.activeElement as HTMLTextAreaElement;
        const rect = textArea.getBoundingClientRect();
        
        // Estimate cursor position (simplified)
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const now = Date.now();
        if (now - lastParticleTime > PARTICLE_INTERVAL) {
          lastParticleTime = now;
          
          // Create new particle at estimated cursor position
          setParticles(prev => [
            ...prev,
            { 
              id: now, 
              x, 
              y, 
              createdAt: now 
            }
          ]);
          
          // Cleanup old particles after 2 seconds
          timeout = setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== now));
          }, 2000);
        }
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [enabled]);

  // Remove particles older than 2 seconds
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      setParticles(prev => prev.filter(p => now - p.createdAt < 2000));
    }, 2000);
    
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40">
      {particles.map(particle => (
        <ParticleEffect
          key={particle.id}
          x={particle.x}
          y={particle.y}
          amount={5}
          duration={1.5}
          isDark={isDark}
          onComplete={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}
    </div>
  );
} 