import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Button } from '../../common/Button';

export const ExplorePanel = () => {
  const { state, toggleMarketplace, runAnalysis } = useWorkspace();
  const { activeDataset, previewData, previewColumns } = state;
  const [intent, setIntent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!activeDataset) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
          </svg>
          <p>Select a dataset from the sidebar to explore</p>
        </div>
      </div>
    );
  }

  const handleGetInsights = async () => {
    if (!intent.trim()) return;
    setIsAnalyzing(true);
    try {
      await runAnalysis(intent);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{activeDataset.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeDataset.row_count} rows &middot; {previewColumns.length} columns &middot; {activeDataset.type.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleMarketplace}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            + External Data
          </button>
        </div>
      </div>

      {/* Column summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Columns</h3>
        <div className="flex flex-wrap gap-2">
          {activeDataset.columns.map((col) => (
            <span
              key={col.name}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
            >
              {col.name}
              <span className="text-gray-400">({col.type})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Data table */}
      {previewData && previewData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  {previewColumns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {previewData.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
                    {previewColumns.map((col) => (
                      <td key={col} className="px-4 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                        {row[col] != null ? String(row[col]) : <span className="text-gray-300">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 20 && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
              Showing 20 of {previewData.length} preview rows ({activeDataset.row_count} total)
            </div>
          )}
        </div>
      )}

      {/* AI Insights prompt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Get AI Insights</h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe what you want to predict or analyze, and AI will suggest the best approach.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGetInsights()}
            placeholder="e.g., I want to predict house prices based on features..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <Button
            onClick={handleGetInsights}
            isLoading={isAnalyzing}
            disabled={!intent.trim() || isAnalyzing}
          >
            Analyze
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
