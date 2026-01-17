import { useState, useMemo } from 'react';
import { motion, AnimatePresence  } from 'framer-motion';

interface Feature {
  name: string;
  type: string;
}

interface FeatureSelectorProps {
  features: Feature[];
  selectedFeatures: string[];
  targetColumn: string;
  temporalColumn: string;
  hasTemporalData: boolean;
  onFeaturesChange: (features: string[]) => void;
  onTargetChange: (target: string) => void;
  onTemporalChange: (temporal: string) => void;
  onHasTemporalChange: (hasIt: boolean) => void;
}

export const FeatureSelector = ({
  features,
  selectedFeatures,
  targetColumn,
  temporalColumn,
  hasTemporalData,
  onFeaturesChange,
  onTargetChange,
  onTemporalChange,
  onHasTemporalChange,
}: FeatureSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFeatures = useMemo(() => {
    return features.filter((f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [features, searchTerm]);

  const handleToggleFeature = (featureName: string) => {
    if (selectedFeatures.includes(featureName)) {
      onFeaturesChange(selectedFeatures.filter((f) => f !== featureName));
    } else {
      onFeaturesChange([...selectedFeatures, featureName]);
    }
  };

  const handleSelectAll = () => {
    onFeaturesChange(filteredFeatures.map((f) => f.name));
  };

  const handleDeselectAll = () => {
    onFeaturesChange([]);
  };

  const handleSelectOnlyNumeric = () => {
    const numericFeatures = filteredFeatures
      .filter((f) => f.type === 'float' || f.type === 'integer')
      .map((f) => f.name);
    onFeaturesChange(numericFeatures);
  };

  return (
    <div className="space-y-6">
      {/* Target Column */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Target Column (What to predict)
        </label>
        <select
          value={targetColumn}
          onChange={(e) => onTargetChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="">Select target column</option>
          {features.map((feature) => (
            <option key={feature.name} value={feature.name}>
              {feature.name} ({feature.type})
            </option>
          ))}
        </select>
      </div>

      {/* Feature Columns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-900">
            Feature Columns ({selectedFeatures.length} of {features.length} selected)
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Deselect All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleSelectOnlyNumeric}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Only Numeric
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Feature Grid */}
        <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          <div className="grid grid-cols-3 gap-px bg-gray-200">
            {filteredFeatures.map((feature) => {
              const isSelected = selectedFeatures.includes(feature.name);
              return (
                <motion.label
                  key={feature.name}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className={`flex items-center gap-2 p-3 bg-white cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleFeature(feature.name)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {feature.name}
                    </p>
                    <p className="text-xs text-gray-500">{feature.type}</p>
                  </div>
                </motion.label>
              );
            })}
          </div>
        </div>
      </div>

        {/* Temporal Data Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
            <input
            type="checkbox"
            checked={hasTemporalData}
            onChange={(e) => onHasTemporalChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
            />
            <div className="flex-1">
            <span className="block text-sm font-medium text-gray-900">
                Dataset has temporal/time-series data
            </span>
            <p className="text-xs text-gray-600 mt-1">
                Enable chronological splitting to prevent data leakage
            </p>
            </div>
        </label>

        <AnimatePresence>
            {hasTemporalData && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    Temporal Column
                </label>
                <select
                    value={temporalColumn}
                    onChange={(e) => onTemporalChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                    <option value="">Select temporal column</option>
                    {features
                    .filter((f) => f.type === 'categorical' || f.type === 'datetime')
                    .map((feature) => (
                        <option key={feature.name} value={feature.name}>
                        {feature.name}
                        </option>
                    ))}
                </select>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
        </div>
    </div>
  );
};