import { CSSProperties } from 'react';

interface StatsCardProps {
  value: string;
  label: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export const StatsCard = ({ value, label, top, bottom, left, right }: StatsCardProps) => {
  const style: CSSProperties = {
    position: 'absolute',
    top,
    bottom,
    left,
    right,
  };

  return (
    <div 
      style={style}
      className="glass-card p-6 rounded-2xl animate-float hidden lg:block"
    >
      <p className="text-4xl font-bold text-white mb-1">
        {value}
      </p>
      <p className="text-sm text-white/50">
        {label}
      </p>
    </div>
  );
};