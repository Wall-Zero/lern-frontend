import { motion } from 'framer-motion';

interface PredictionStatsCardProps {
  totalPredictions: number;
  avgPrediction: number;
  minPrediction: number;
  maxPrediction: number;
}

export const PredictionStatsCard = ({ 
  totalPredictions, 
  avgPrediction, 
  minPrediction, 
  maxPrediction,
}: PredictionStatsCardProps) => {
  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-1">Total Predictions</p>
          <p className="text-3xl font-bold text-gray-900">{totalPredictions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-1">Average</p>
          <p className="text-3xl font-bold text-gray-900">{avgPrediction.toFixed(4)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-1">Minimum</p>
          <p className="text-3xl font-bold text-gray-900">{minPrediction.toFixed(4)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <p className="text-sm font-medium text-gray-600 mb-1">Maximum</p>
          <p className="text-3xl font-bold text-gray-900">{maxPrediction.toFixed(4)}</p>
        </motion.div>
      </div>
    </div>
  );
};