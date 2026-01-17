import { useState } from 'react';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { Button } from '../common/Button';
import { PredictionStatsCard } from './PredictionStatsCard';
import type { PredictionResult } from '../../types/predictions.types';

interface PredictionResultsProps {
  predictions: PredictionResult[];
  onReset: () => void;
}

export const PredictionResults = ({ predictions, onReset }: PredictionResultsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats
  const predictionValues = predictions.map(p => p.prediction);
  const targetColumn = predictions[0]?.target_column || 'N/A'; // NUEVO
  
  const stats = {
    total: predictions.length,
    avg: predictionValues.reduce((a, b) => a + b, 0) / predictionValues.length,
    min: Math.min(...predictionValues),
    max: Math.max(...predictionValues),
    targetColumn // NUEVO
  };

  // Pagination
  const totalPages = Math.ceil(predictions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPredictions = predictions.slice(startIndex, startIndex + itemsPerPage);

  // Download CSV
  const handleDownload = () => {
    const csvData = predictions.map(p => ({
      sample_index: p.sample_index,
      [p.target_column]: p.prediction, // Use target column name
      ...p.input
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${targetColumn}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats with Target Column */}
      <PredictionStatsCard
        totalPredictions={stats.total}
        avgPrediction={stats.avg}
        minPrediction={stats.min}
        maxPrediction={stats.max}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Prediction Results</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing predictions for <span className="font-semibold text-gray-900">{targetColumn}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onReset}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            New Prediction
          </Button>
          <Button onClick={handleDownload}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prediction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Input Preview
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPredictions.map((pred) => (
                <tr key={pred.sample_index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pred.sample_index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {pred.prediction.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <details className="cursor-pointer">
                      <summary className="font-medium text-gray-900 hover:text-blue-600">
                        View {Object.keys(pred.input).length} columns
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(pred.input).slice(0, 6).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium text-gray-700">{key}:</span>{' '}
                            <span className="text-gray-600">{String(value).slice(0, 20)}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, predictions.length)} of{' '}
              {predictions.length} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};