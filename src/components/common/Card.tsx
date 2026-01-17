import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export const Card = ({ children, hover = false, className = '', ...props }: CardProps) => {
  const hoverStyles = hover ? 'hover:shadow-card-hover cursor-pointer transition-shadow duration-200' : '';
  
  return (
    <div
      className={`bg-white rounded-lg shadow-card p-6 ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};