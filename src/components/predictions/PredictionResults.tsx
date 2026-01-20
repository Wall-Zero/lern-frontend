import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import type { PredictionResult } from '../../api/endpoints/predictions';

interface PredictionResultsProps {
  predictions: PredictionResult[];
  modelName: string;
  targetColumn: string;
  onDownloadCSV: () => void;
  onDownloadJSON: () => void;
  onStartNew: () => void;
}

export const PredictionResults = ({
  predictions,
  modelName,
  targetColumn,
  onDownloadCSV,
  onDownloadJSON,
  onStartNew,
}: PredictionResultsProps) => {
  // Get first 20 results for preview
  const previewResults = predictions.slice(0, 20);
  
  // Get all column names from first prediction
  const inputColumns = predictions.length > 0 ? Object.keys(predictions[0].input) : [];
  console.log('results', predictions);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Success Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              ✨ Predictions Complete!
            </h3>
            <p className="text-gray-700 mb-3">
              Successfully predicted <strong>{predictions.length} rows</strong> using <strong>{modelName}</strong>
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Prediction Results</h4>
              <p className="text-sm text-gray-600">
                Showing {previewResults.length} of {predictions.length} predictions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onDownloadJSON} className='flex items-center'>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </Button>
              <Button variant="flex" onClick={onDownloadCSV}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  #
                </th>
                {inputColumns.map((col) => (
                  <th 
                    key={col} 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap bg-green-50 text-green-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Predicted {targetColumn}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {previewResults.map((result, idx) => (
                <motion.tr
                  key={result.sample_index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-500 font-medium sticky left-0 bg-white">
                    {result.sample_index + 1}
                  </td>
                  {inputColumns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {result.input[col] !== null && result.input[col] !== undefined 
                        ? String(result.input[col]) 
                        : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap bg-green-50">
                    <span className="text-green-700">
                      {typeof result.prediction === 'number' 
                        ? result.prediction.toFixed(2)
                        : result.prediction}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {predictions.length > 20 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
            + {predictions.length - 20} more predictions (download to see all)
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <Button variant="flex" onClick={onStartNew}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Prediction
        </Button>
      </div>
    </motion.div>
  );
};