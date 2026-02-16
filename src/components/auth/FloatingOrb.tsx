import type { CSSProperties } from 'react';

interface FloatingOrbProps {
  color: string;
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  duration?: number;
}

export const FloatingOrb = ({ 
  color, 
  size, 
  top, 
  bottom, 
  left, 
  right,
  duration = 10 
}: FloatingOrbProps) => {
  const style: CSSProperties = {
    position: 'absolute',
    width: `${size}px`,
    height: `${size}px`,
    top,
    bottom,
    left,
    right,
    background: `radial-gradient(circle, ${color}40, transparent 70%)`,
    filter: 'blur(60px)',
    animation: `float ${duration}s ease-in-out infinite`,
    pointerEvents: 'none',
  };

  return <div style={style} />;
};