import { motion } from 'framer-motion';
import type { Metrics } from '../../types/aitools.types';

interface TrainingMetricsProps {
  metrics: Metrics;
  trainingDuration: number;
  trainingSamples: number;
  testSamples: number;
}

export const TrainingMetrics = ({ 
  metrics, 
  trainingDuration, 
  trainingSamples, 
  testSamples 
}: TrainingMetricsProps) => {
  const getR2Color = (score: number) => {
    if (score >= 0.8) return 'text-green-700 bg-green-100';
    if (score >= 0.6) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-600">R² Score</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getR2Color(metrics.r2_score)}`}>
            {(metrics.r2_score * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{metrics.r2_score.toFixed(4)}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h4 className="text-sm font-medium text-gray-600 mb-2">RMSE</h4>
        <p className="text-3xl font-bold text-gray-900">{metrics.rmse.toFixed(4)}</p>
        <p className="text-xs text-gray-500 mt-1">Root Mean Squared Error</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h4 className="text-sm font-medium text-gray-600 mb-2">MAE</h4>
        <p className="text-3xl font-bold text-gray-900">{metrics.mae.toFixed(4)}</p>
        <p className="text-xs text-gray-500 mt-1">Mean Absolute Error</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h4 className="text-sm font-medium text-gray-600 mb-2">Training Time</h4>
        <p className="text-3xl font-bold text-gray-900">{trainingDuration.toFixed(2)}s</p>
        <p className="text-xs text-gray-500 mt-1">
          {trainingSamples} train / {testSamples} test
        </p>
      </motion.div>
    </div>
  );
};