import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import type { AITool, Approach, FeatureColumn } from '../../types/aitools.types';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';

interface ConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigure: (data: any) => Promise<void>;
  tool: AITool;
  selectedApproach: Approach;
}

export const ConfigureModal = ({ isOpen, onClose, onConfigure, tool, selectedApproach }: ConfigureModalProps) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [targetColumn, setTargetColumn] = useState('');
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [temporalColumn, setTemporalColumn] = useState('');
  const [hasTemporalData, setHasTemporalData] = useState(false);
  
  // Hyperparameters state
  const [hyperparameters, setHyperparameters] = useState<Record<string, any>>(
    selectedApproach.hyperparameters
  );

  useEffect(() => {
    loadDataset();
    // Pre-select recommended features and target from analysis
    if (tool.analysis?.required_config) {
      const config = tool.analysis.required_config;
      setTargetColumn(config.target_column);
      setHasTemporalData(config.has_temporal_data);
      setTrainTestSplit(config.train_test_split);
      
      const recommendedFeatures = new Set(
        config.feature_columns.map(f => f.name)
      );
      setSelectedFeatures(recommendedFeatures);
    }
  }, [tool]);

  const loadDataset = async () => {
    try {
      const data = await datasetsApi.get(tool.data_source_id);
      setDataset(data);
    } catch (error) {
      console.error('Failed to load dataset:', error);
    }
  };

  const toggleFeature = (columnName: string) => {
    const newSet = new Set(selectedFeatures);
    if (newSet.has(columnName)) {
      newSet.delete(columnName);
    } else {
      newSet.add(columnName);
    }
    setSelectedFeatures(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfiguring(true);

    try {
      const featureColumns: FeatureColumn[] = Array.from(selectedFeatures).map(name => {
        const column = dataset?.columns.find(c => c.name === name);
        return {
          name,
          type: column?.type || 'float',
        };
      });

      const configData = {
        selected_approach: selectedApproach.name,
        model_type: selectedApproach.model_type,
        target_column: targetColumn,
        feature_columns: featureColumns,
        algorithm: selectedApproach.algorithm,
        hyperparameters,
        train_test_split: trainTestSplit,
        random_state: 42,
        has_temporal_data: hasTemporalData ? 'True' : 'False',
        ...(hasTemporalData && temporalColumn && { temporal_column: temporalColumn }),
      };

      await onConfigure(configData);
      handleClose();
    } catch (error) {
      console.error('Configuration failed:', error);
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const updateHyperparameter = (key: string, value: any) => {
    setHyperparameters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!dataset) return null;
  console.log('Selected Features:', selectedFeatures);
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Configure Model</h2>
                  <p className="text-sm text-gray-600">{selectedApproach.name}</p>
                </div>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Target Column */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Column (What to predict)
                  </label>
                  <select
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Select target column</option>
                    {dataset.columns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feature Columns */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Feature Columns ({selectedFeatures.size} selected)
                  </label>
                  <div className="border border-gray-300 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {dataset.columns
                        .filter(col => col.name !== targetColumn)
                        .map((col) => (
                          <label
                            key={col.name}
                            className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFeatures.has(col.name)}
                              onChange={() => toggleFeature(col.name)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm text-gray-900">{col.name}</span>
                            <span className="ml-auto text-xs text-gray-500">{col.type}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Temporal Data */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasTemporalData}
                      onChange={(e) => setHasTemporalData(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-semibold text-gray-700">
                      Dataset has temporal/time-series data
                    </span>
                  </label>
                  
                  {hasTemporalData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4"
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Temporal Column
                      </label>
                      <select
                        value={temporalColumn}
                        onChange={(e) => setTemporalColumn(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Select temporal column</option>
                        {dataset.columns.map((col) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>

                {/* Train/Test Split */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Train/Test Split: {(trainTestSplit * 100).toFixed(0)}% / {((1 - trainTestSplit) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={trainTestSplit}
                    onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Hyperparameters */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Hyperparameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(hyperparameters).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = typeof value === 'number' && !Number.isInteger(value)
                              ? parseFloat(e.target.value)
                              : parseInt(e.target.value);
                            updateHyperparameter(key, newValue);
                          }}
                          step={typeof value === 'number' && !Number.isInteger(value) ? '0.1' : '1'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
                  <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isConfiguring}
                    disabled={!targetColumn || selectedFeatures.size === 0}
                  >
                    {isConfiguring ? 'Configuring...' : 'Configure Model'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};