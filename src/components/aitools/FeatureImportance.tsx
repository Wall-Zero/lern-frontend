import { motion } from 'framer-motion';

interface FeatureImportanceProps {
  importance: Record<string, number>;
}

export const FeatureImportance = ({ importance }: FeatureImportanceProps) => {
  const sortedFeatures = Object.entries(importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxImportance = sortedFeatures[0]?.[1] || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Feature Importance</h3>
      <div className="space-y-3">
        {sortedFeatures.map(([feature, value], idx) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{feature}</span>
              <span className="text-sm font-semibold text-blue-600">
                {(value * 100).toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(value / maxImportance) * 100}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};