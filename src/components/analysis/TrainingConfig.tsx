import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface TrainingConfigProps {
  trainTestSplit: number;
  hyperparameters: Record<string, any>;
  onSplitChange: (split: number) => void;
  onHyperparametersChange: (params: Record<string, any>) => void;
}

export const TrainingConfig = ({
  trainTestSplit,
  hyperparameters,
  onSplitChange,
  onHyperparametersChange,
}: TrainingConfigProps) => {
  const [isHyperparametersOpen, setIsHyperparametersOpen] = useState(false);

  const handleHyperparameterChange = (key: string, value: any) => {
    onHyperparametersChange({
      ...hyperparameters,
      [key]: value,
    });
  };

  const hyperparameterEntries = Object.entries(hyperparameters || {});
  const leftColumn = hyperparameterEntries.filter((_, i) => i % 2 === 0);
  const rightColumn = hyperparameterEntries.filter((_, i) => i % 2 === 1);

  return (
    <div className="space-y-6">
      {/* Train/Test Split */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-4">
          Train/Test Split
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Train</p>
              <p className="text-3xl font-bold text-primary-600">
                {Math.round(trainTestSplit * 100)}%
              </p>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Test</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round((1 - trainTestSplit) * 100)}%
              </p>
            </div>
          </div>
          
          <div className="px-2">
            <Slider
              min={0.5}
              max={0.95}
              step={0.05}
              value={trainTestSplit}
              onChange={(value) => onSplitChange(value as number)}
              railStyle={{ backgroundColor: '#e5e7eb', height: 8 }}
              trackStyle={{ backgroundColor: '#7c3aed', height: 8 }}
              handleStyle={{
                backgroundColor: '#7c3aed',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
                width: 20,
                height: 20,
                marginTop: -6,
                opacity: 1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Hyperparameters Collapsible */}
      <div>
        <button
          onClick={() => setIsHyperparametersOpen(!isHyperparametersOpen)}
          className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Advanced: Hyperparameters (Optional)</p>
              <p className="text-sm text-gray-600">Use default values or customize</p>
            </div>
          </div>
          <motion.svg
            animate={{ rotate: isHyperparametersOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {isHyperparametersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {leftColumn.map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value ?? ''}
                          onChange={(e) =>
                            handleHyperparameterChange(
                              key,
                              typeof value === 'number'
                                ? parseFloat(e.target.value) || 0
                                : e.target.value
                            )
                          }
                          step={typeof value === 'number' && value < 1 ? '0.01' : '1'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {rightColumn.map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value ?? ''}
                          onChange={(e) =>
                            handleHyperparameterChange(
                              key,
                              typeof value === 'number'
                                ? parseFloat(e.target.value) || 0
                                : e.target.value
                            )
                          }
                          step={typeof value === 'number' && value < 1 ? '0.01' : '1'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};