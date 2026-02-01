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

interface StageHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const StageHeader = ({ onMenuClick, showMenuButton }: StageHeaderProps) => {
  const { state, setStage } = useWorkspace();
  const currentIndex = stages.findIndex((s) => s.key === state.stage);

  const canNavigateTo = (index: number): boolean => {
    if (index === 0) return true;
    if (index === 1) return !!state.activeDataset;
    if (index === 2) return !!state.activeTool;
    if (index === 3) return !!state.activeTool?.analysis;
    if (index === 4) return state.activeTool?.status === 'trained';
    return false;
  };

  return (
    <>
      <style>{`
        .stage-header {
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 24px;
          font-family: 'Outfit', sans-serif;
        }
        .stage-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 48rem;
          margin: 0 auto;
        }
        .stage-item {
          display: flex;
          align-items: center;
        }
        .stage-connector {
          width: 48px;
          height: 2px;
          margin: 0 4px;
          transition: background-color 0.2s ease;
        }
        .stage-connector--active {
          background: #0d9488;
        }
        .stage-connector--inactive {
          background: #e5e7eb;
        }
        .stage-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: default;
        }
        .stage-btn--active {
          background: rgba(13, 148, 136, 0.08);
          color: #0f766e;
        }
        .stage-btn--completed {
          color: #0d9488;
          cursor: pointer;
        }
        .stage-btn--completed:hover {
          background: rgba(13, 148, 136, 0.08);
        }
        .stage-btn--clickable {
          color: #6b7280;
          cursor: pointer;
        }
        .stage-btn--clickable:hover {
          background: #f9fafb;
        }
        .stage-btn--disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }
        .stage-icon {
          width: 20px;
          height: 20px;
        }
        .stage-icon--completed {
          color: #0d9488;
        }
        .stage-label {
          display: none;
        }
        @media (min-width: 640px) {
          .stage-label {
            display: inline;
          }
        }
      `}</style>
      <div className="stage-header">
        <div className="stage-header-inner">
          {/* Mobile menu button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                background: '#f3f4f6',
                marginRight: '12px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" fill="none" stroke="#374151" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {stages.map((stage, index) => {
            const isActive = stage.key === state.stage;
            const isCompleted = index < currentIndex;
            const isClickable = canNavigateTo(index);

            const btnClass = [
              'stage-btn',
              isActive
                ? 'stage-btn--active'
                : isCompleted
                ? 'stage-btn--completed'
                : isClickable
                ? 'stage-btn--clickable'
                : 'stage-btn--disabled',
            ].join(' ');

            return (
              <div key={stage.key} className="stage-item">
                {index > 0 && (
                  <div
                    className={`stage-connector ${
                      index <= currentIndex
                        ? 'stage-connector--active'
                        : 'stage-connector--inactive'
                    }`}
                  />
                )}
                <button
                  onClick={() => isClickable && setStage(stage.key)}
                  disabled={!isClickable}
                  className={btnClass}
                >
                  <div style={{ position: 'relative' }}>
                    {isCompleted ? (
                      <motion.svg
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="stage-icon stage-icon--completed"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </motion.svg>
                    ) : (
                      <svg className="stage-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stage.icon} />
                      </svg>
                    )}
                  </div>
                  <span className="stage-label">{stage.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
