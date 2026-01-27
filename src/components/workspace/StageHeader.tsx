import { motion } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { Stage } from '../../types/workspace.types';

const stages: { key: Stage; label: string; icon: string }[] = [
  { key: 'upload', label: 'Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { key: 'explore', label: 'Explore', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { key: 'insights', label: 'Insights', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'train', label: 'Train', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { key: 'predict', label: 'Predict', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const StageHeader = () => {
  const { state, setStage } = useWorkspace();
  const currentIndex = stages.findIndex((s) => s.key === state.stage);

  const canNavigateTo = (index: number): boolean => {
    // Can always go back to upload
    if (index === 0) return true;
    // Can go to explore if we have a dataset
    if (index === 1) return !!state.activeDataset;
    // Can go to insights if we have a tool
    if (index === 2) return !!state.activeTool;
    // Can go to train if tool has analysis
    if (index === 3) return !!state.activeTool?.analysis;
    // Can go to predict if tool is trained
    if (index === 4) return state.activeTool?.status === 'trained';
    return false;
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {stages.map((stage, index) => {
          const isActive = stage.key === state.stage;
          const isCompleted = index < currentIndex;
          const isClickable = canNavigateTo(index);

          return (
            <div key={stage.key} className="flex items-center">
              {index > 0 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    index <= currentIndex ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}
              <button
                onClick={() => isClickable && setStage(stage.key)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : isCompleted
                    ? 'text-primary-600 hover:bg-primary-50 cursor-pointer'
                    : isClickable
                    ? 'text-gray-500 hover:bg-gray-50 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="relative">
                  {isCompleted ? (
                    <motion.svg
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 text-primary-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stage.icon} />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{stage.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
