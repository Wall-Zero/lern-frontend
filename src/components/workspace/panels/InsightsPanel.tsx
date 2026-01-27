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
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>No analysis available. Go back to Explore and run an analysis.</p>
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Analysis Results</h1>
        <p className="text-sm text-gray-500 mt-1">Analysis for: {activeTool.name}</p>
      </div>

      {/* Feasibility */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            analysis.feasible ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {analysis.feasible ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {analysis.feasible ? 'Analysis is Feasible' : 'Analysis May Not Be Feasible'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={analysis.confidence > 0.7 ? 'success' : analysis.confidence > 0.4 ? 'yellow' : 'error'}>
                {Math.round(analysis.confidence * 100)}% confidence
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">{analysis.reasoning}</p>
      </motion.div>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Warnings</h3>
          <ul className="space-y-1">
            {analysis.warnings.map((w, i) => (
              <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Recommendations</h3>
          <ul className="space-y-1">
            {analysis.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">*</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Approaches */}
      {approaches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
        <div className="flex gap-4 pt-4 border-t border-gray-200">
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
  );
};
