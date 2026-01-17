import { motion } from 'framer-motion';
import type { ValidationResult } from '../../types/predictions.types';

interface ColumnValidationMatrixProps {
  validation: ValidationResult;
}

export const ColumnValidationMatrix = ({ validation }: ColumnValidationMatrixProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900">Column Validation</h4>
        {validation.isValid ? (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            ✓ All Required Columns Present
          </span>
        ) : (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            ⚠ {validation.missing.length} Missing Column(s)
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Required Columns Status */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">
            Required Columns ({validation.required.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {validation.required.map((col) => {
              const isMissing = validation.missing.includes(col);
              return (
                <div
                  key={col}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isMissing
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-green-50 text-green-800 border border-green-200'
                  }`}
                >
                  {isMissing ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="truncate" title={col}>{col}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extra Columns Info */}
        {validation.extra.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Extra Columns ({validation.extra.length}) - Will be ignored
            </p>
            <div className="flex flex-wrap gap-2">
              {validation.extra.slice(0, 10).map((col) => (
                <span
                  key={col}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                  title={col}
                >
                  {col.slice(0, 20)}
                  {col.length > 20 && '...'}
                </span>
              ))}
              {validation.extra.length > 10 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{validation.extra.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};