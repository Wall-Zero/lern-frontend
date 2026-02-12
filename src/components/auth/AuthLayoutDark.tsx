import type { ReactNode } from 'react';
import { FloatingOrb } from './FloatingOrb';
import { StatsCard } from './StatsCard';
import { GridPattern } from './GridPattern';

interface AuthLayoutDarkProps {
  children: ReactNode;
}

export const AuthLayoutDark = ({ children }: AuthLayoutDarkProps) => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Grid Pattern Background */}
      <GridPattern />
      
      {/* Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#00ffc8]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#a855f7]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Floating Orbs */}
      <FloatingOrb 
        color="#00ffc8" 
        size={400} 
        top="10%" 
        left="15%" 
        duration={15}
      />
      <FloatingOrb 
        color="#a855f7" 
        size={300} 
        top="60%" 
        right="20%" 
        duration={12}
      />
      <FloatingOrb 
        color="#00ff66" 
        size={250} 
        bottom="15%" 
        left="70%" 
        duration={18}
      />
      
      {/* Stats Cards */}
      <StatsCard 
        value="1,247+" 
        label="Models Trained" 
        top="15%" 
        right="8%"
      />
      <StatsCard 
        value="98.5%" 
        label="Accuracy Rate" 
        bottom="20%" 
        left="10%"
      />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
};