import { motion } from 'framer-motion';
import type { Analysis } from '../../types/aitools.types';

interface FeasibilityCardProps {
  analysis: Analysis;
}

export const FeasibilityCard = ({ analysis }: FeasibilityCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        {analysis.feasible ? (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {analysis.feasible ? 'Analysis Feasible' : 'Analysis Not Feasible'}
          </h3>
          <p className="text-sm text-gray-600">
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <p className="text-gray-700">{analysis.reasoning}</p>
    </motion.div>
  );
};