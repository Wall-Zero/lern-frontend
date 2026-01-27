import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { AlgorithmCard } from '../../analysis/AlgorithmCard';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';

export const InsightsPanel = () => {
  const { state, setStage, quickTrain } = useWorkspace();
  const { activeTool } = state;
  const [selectedApproachIdx, setSelectedApproachIdx] = useState(0);
  const [isQuickTraining, setIsQuickTraining] = useState(false);

  if (!activeTool || !activeTool.analysis) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#9ca3af' }}>
        <p style={{ fontFamily: '"Outfit", sans-serif' }}>No analysis available. Go back to Explore and run an analysis.</p>
      </div>
    );
  }

  const analysis = activeTool.analysis;
  const approaches = analysis.approaches || [];
  const selectedApproach = approaches[selectedApproachIdx];

  const handleQuickTrain = async () => {
    if (!selectedApproach || !analysis.required_config) return;
    setIsQuickTraining(true);
    try {
      await quickTrain({
        approach_index: selectedApproachIdx,
        target_column: analysis.required_config.target_column,
        feature_columns: analysis.required_config.feature_columns.map((f) =>
          typeof f === 'string' ? f : f.name
        ),
        train_test_split: analysis.required_config.train_test_split || 0.8,
        has_temporal_data: analysis.required_config.has_temporal_data,
      });
    } finally {
      setIsQuickTraining(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .insights-panel {
          font-family: 'Outfit', sans-serif;
          background: #f9fafb;
        }
        .insights-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .insights-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .insights-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #111827;
        }
        .insights-subheading {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #111827;
        }
        .insights-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .insights-confidence-value {
          font-family: 'JetBrains Mono', monospace;
        }
        .insights-action-bar {
          display: flex;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
      <div className="p-6 space-y-6 max-w-4xl mx-auto insights-panel">
        {/* Header */}
        <div>
          <h1 className="insights-heading">AI Analysis Results</h1>
          <p className="insights-subtitle">Analysis for: {activeTool.name}</p>
        </div>

        {/* Feasibility */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="insights-card"
          style={{ padding: '24px' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: analysis.feasible ? '#dcfce7' : '#fee2e2',
              }}
            >
              {analysis.feasible ? (
                <svg className="w-6 h-6" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="insights-subheading">
                {analysis.feasible ? 'Analysis is Feasible' : 'Analysis May Not Be Feasible'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={analysis.confidence > 0.7 ? 'success' : analysis.confidence > 0.4 ? 'yellow' : 'error'}>
                  <span className="insights-confidence-value">
                    {Math.round(analysis.confidence * 100)}% confidence
                  </span>
                </Badge>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: '"Outfit", sans-serif' }}>{analysis.reasoning}</p>
        </motion.div>

        {/* Warnings */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <div
            style={{
              background: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#854d0e', marginBottom: '8px', fontFamily: '"Outfit", sans-serif' }}>
              Warnings
            </h3>
            <ul className="space-y-1">
              {analysis.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: '14px', color: '#a16207' }}>
                  <span style={{ color: '#ca8a04', marginTop: '2px' }}>!</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div
            style={{
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f766e', marginBottom: '8px', fontFamily: '"Outfit", sans-serif' }}>
              Recommendations
            </h3>
            <ul className="space-y-1">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2" style={{ fontSize: '14px', color: '#0d9488' }}>
                  <span style={{ color: '#14b8a6', marginTop: '2px' }}>*</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Approaches */}
        {approaches.length > 0 && (
          <div>
            <h3 className="insights-subheading" style={{ marginBottom: '16px' }}>
              Suggested Approaches ({approaches.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {approaches.map((approach, idx) => (
                <AlgorithmCard
                  key={idx}
                  algorithm={approach}
                  isRecommended={idx === 0}
                  isSelected={idx === selectedApproachIdx}
                  onClick={() => setSelectedApproachIdx(idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {analysis.feasible && approaches.length > 0 && (
          <div className="insights-action-bar">
            <Button
              onClick={handleQuickTrain}
              isLoading={isQuickTraining}
              className="flex-1"
            >
              Quick Train with {selectedApproach?.name || 'selected approach'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setStage('train')}
              className="flex-1"
            >
              Customize Training
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
