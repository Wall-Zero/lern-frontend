import { motion } from 'framer-motion';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface AlgorithmCardProps {
  algorithm: {
    name: string;
    algorithm: string;
    description: string;
    pros: string[];
    cons: string[];
    expected_accuracy: number;
  };
  isRecommended?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export const AlgorithmCard = ({
  algorithm,
  isRecommended,
  isSelected,
  onClick,
}: AlgorithmCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isSelected
            ? 'border-2 border-primary-600 shadow-lg'
            : 'border border-gray-200 hover:border-primary-300 hover:shadow-md'
        }`}
        onClick={onClick}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {algorithm.name}
                </h3>
                {isRecommended && (
                  <Badge variant="purple" size="sm">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Recommended
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="blue" size="sm">
                  {Math.round(algorithm.expected_accuracy * 100)}% accuracy
                </Badge>
              </div>
            </div>
            {isSelected && (
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3">{algorithm.description}</p>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
            {/* Pros */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pros
              </h4>
              <ul className="space-y-1">
                {algorithm.pros.slice(0, 3).map((pro, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span className="line-clamp-2">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cons
              </h4>
              <ul className="space-y-1">
                {algorithm.cons.slice(0, 3).map((con, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span className="line-clamp-2">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};