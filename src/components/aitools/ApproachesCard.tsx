import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import type { Approach } from '../../types/aitools.types';

interface ApproachesCardProps {
  approaches: Approach[];
  currentAlgorithm?: string;
  status: string;
  onConfigureClick: (approach: Approach) => void;
}

export const ApproachesCard = ({ approaches, currentAlgorithm, status, onConfigureClick }: ApproachesCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended Approaches</h3>
      <div className="space-y-4">
        {approaches.map((approach, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">{approach.name}</h4>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {(approach.expected_accuracy * 100).toFixed(0)}% accuracy
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{approach.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2">Pros</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {approach.pros.slice(0, 3).map((pro, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">Cons</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {approach.cons.slice(0, 3).map((con, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-500 mr-1">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {(status === 'configuring' || status === 'configured') && (
              <Button
                className="w-full mt-3"
                onClick={() => onConfigureClick(approach)}
              >
                {currentAlgorithm === approach.algorithm ? 'Reconfigure' : 'Configure'} This Approach
              </Button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};