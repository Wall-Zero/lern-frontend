// src/components/criminal-law/CriminalLawSidebar.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCriminalLaw } from '../../context/CriminalLawContext';

const ScaleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

interface CriminalLawSidebarProps {
  onClose?: () => void;
}

export const CriminalLawSidebar = ({ onClose }: CriminalLawSidebarProps) => {
  const { state, setFilters, clearFilters, fetchVolumes, fetchStatistics } = useCriminalLaw();
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    fetchVolumes();
    fetchStatistics();
  }, [fetchVolumes, fetchStatistics]);

  const handleVolumeToggle = (volume: string) => {
    setSelectedVolumes((prev) =>
      prev.includes(volume) ? prev.filter((v) => v !== volume) : [...prev, volume]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleApplyFilters = () => {
    setFilters({
      volume: selectedVolumes.length === 1 ? selectedVolumes[0] : undefined,
      status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
    });
  };

  const handleClearFilters = () => {
    setSelectedVolumes([]);
    setSelectedStatuses([]);
    clearFilters();
  };

  const statusOptions = [
    { value: 'valid', label: 'Valid', color: '#10b981' },
    { value: 'history', label: 'History', color: '#3b82f6' },
    { value: 'repealed_law', label: 'Repealed', color: '#ef4444' },
    { value: 'case_digest', label: 'Case Digest', color: '#8b5cf6' },
    { value: 'practice_guide', label: 'Guide', color: '#f59e0b' },
  ];

  // Get top 5 volumes by count
  const topVolumes = state.statistics?.by_volume.slice(0, 5).map(v => v.volume) || state.volumes.slice(0, 5);

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo - Back to Dashboard - TEAL */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            }}
          >
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span 
            className="text-base font-bold"
            style={{
              background: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LERN
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mode Indicator - TEAL */}
      <div className="px-4 py-3">
        <div 
          className="flex items-center gap-2 py-2 px-3 rounded-lg text-white font-semibold text-sm shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          }}
        >
          <ScaleIcon />
          Criminal Law Notes
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Filter */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            STATUS
          </p>
          <div className="space-y-2">
            {statusOptions.map((status) => {
              const isSelected = selectedStatuses.includes(status.value);
              return (
                <label
                  key={status.value}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleStatusToggle(status.value)}
                    className="w-4 h-4 rounded border-2 border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                    style={isSelected ? { accentColor: status.color } : {}}
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {status.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply Button - TEAL */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleApplyFilters}
          disabled={selectedVolumes.length === 0 && selectedStatuses.length === 0}
          className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
          }}
        >
          Apply Filters
        </button>
        {(selectedVolumes.length > 0 || selectedStatuses.length > 0) && (
          <button
            onClick={handleClearFilters}
            className="w-full mt-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Footer */}
      {state.statistics && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {state.statistics.total_articles.toLocaleString()} articles •{' '}
            {state.statistics.total_case_references.toLocaleString()} cases
          </p>
        </div>
      )}
    </div>
  );
};