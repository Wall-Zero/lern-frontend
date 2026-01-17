import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aitoolsApi } from '../api/endpoints/aitools';
import { showSuccessToast, showAnalysisReadyToast } from '../lib/toast';
import type { AITool } from '../types/aitools.types';

interface PollingContextType {
  tools: AITool[];
  refreshTools: () => Promise<void>;
  startAggressivePolling: () => void;
}

const PollingContext = createContext<PollingContextType | undefined>(undefined);

export const PollingProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<AITool[]>([]);
  const [isAggressivePolling, setIsAggressivePolling] = useState(false);
  const aggressiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousToolsRef = useRef<AITool[]>([]);

  useEffect(() => {
    refreshTools();
    
    return () => {
      if (aggressiveTimeoutRef.current) {
        clearTimeout(aggressiveTimeoutRef.current);
      }
    };
  }, []);

  // Global polling - FIXED
  useEffect(() => {
    const hasActiveProcesses = tools.some(
      (t) => t.status === 'analyzing' || t.status === 'training'
    );

    if (!hasActiveProcesses && !isAggressivePolling) return;

    // Use faster polling when creating new analysis or has active processes
    const pollInterval = isAggressivePolling ? 1000 : 5000;

    const interval = setInterval(async () => {
      try {
        const response = await aitoolsApi.list();
        const updatedTools = response.results;

        // Check for status changes using ref to avoid stale closure
        updatedTools.forEach((updatedTool) => {
          const oldTool = previousToolsRef.current.find((t) => t.id === updatedTool.id);
          if (oldTool && oldTool.status !== updatedTool.status) {
            if (updatedTool.status === 'configuring') {
              showAnalysisReadyToast(updatedTool.name, () =>
                navigate(`/analysis/${updatedTool.id}`)
              );
            } else if (updatedTool.status === 'trained') {
              showSuccessToast(`${updatedTool.name} training complete!`);
            }
          }
        });

        // Update previous tools ref
        previousToolsRef.current = updatedTools;
        setTools(updatedTools);

        // Stop aggressive polling if new tool detected
        if (isAggressivePolling && updatedTools.length > previousToolsRef.current.length) {
          setIsAggressivePolling(false);
        }
      } catch (error) {
        console.error('Global polling failed:', error);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [tools.length, isAggressivePolling]); // Removed navigate, only track length changes

  // Update previousToolsRef when tools change
  useEffect(() => {
    previousToolsRef.current = tools;
  }, [tools]);

  const refreshTools = async () => {
    try {
      const response = await aitoolsApi.list();
      setTools(response.results);
      previousToolsRef.current = response.results;
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  };

  const startAggressivePolling = () => {
    setIsAggressivePolling(true);
    
    // Auto-stop after 10 seconds
    if (aggressiveTimeoutRef.current) {
      clearTimeout(aggressiveTimeoutRef.current);
    }
    
    aggressiveTimeoutRef.current = setTimeout(() => {
      setIsAggressivePolling(false);
    }, 10000);
  };

  return (
    <PollingContext.Provider value={{ tools, refreshTools, startAggressivePolling }}>
      {children}
    </PollingContext.Provider>
  );
};

export const usePolling = () => {
  const context = useContext(PollingContext);
  if (!context) {
    throw new Error('usePolling must be used within PollingProvider');
  }
  return context;
};