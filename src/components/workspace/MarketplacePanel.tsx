import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import { workspaceApi } from '../../api/endpoints/workspace';
import type { FredSeries } from '../../types/workspace.types';
import { Spinner } from '../common/Spinner';

export const MarketplacePanel = () => {
  const { state, mergeFred, toggleMarketplace } = useWorkspace();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<FredSeries[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dateColumn, setDateColumn] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    try {
      const data = await workspaceApi.browseFred({ search: search.trim() });
      setResults(data.results);
    } catch (err) {
      console.error('FRED search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    if (selected.size === 0 || !dateColumn) return;
    setIsMerging(true);
    try {
      await mergeFred({
        series_ids: Array.from(selected),
        date_column: dateColumn,
        fill_strategy: 'forward',
      });
      setSelected(new Set());
      toggleMarketplace();
    } catch (err) {
      console.error('Merge failed:', err);
    } finally {
      setIsMerging(false);
    }
  };

  const isOpen = state.rightPanel === 'marketplace';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="bg-white border-l border-gray-200 h-full overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              FRED Marketplace
            </h3>
            <button onClick={toggleMarketplace} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search FRED series..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isSearching ? <Spinner /> : 'Search'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 space-y-2">
            {results.map((series) => {
              const isSelected = selected.has(series.id);
              return (
                <motion.div
                  key={series.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSelect(series.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{series.id}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{series.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-400">{series.frequency}</span>
                        <span className="text-xs text-gray-400">{series.units}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {results.length === 0 && !isSearching && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Search for FRED economic data series</p>
                <p className="text-xs mt-1">e.g. GDP, SP500, CPI, unemployment</p>
              </div>
            )}
          </div>

          {/* Merge controls */}
          {selected.size > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date column</label>
                <select
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select date column</option>
                  {state.previewColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleMerge}
                disabled={!dateColumn || isMerging}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isMerging ? 'Merging...' : `Merge ${selected.size} series`}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
