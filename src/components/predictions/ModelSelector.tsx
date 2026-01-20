import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../common/Badge';
import type { AITool } from '../../types/aitools.types';

interface ModelSelectorProps {
  models: AITool[];
  selectedModel: AITool | null;
  onSelect: (model: AITool) => void;
  isLoading?: boolean;
}

export const ModelSelector = ({ models, selectedModel, onSelect, isLoading }: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trained Models</h3>
        <p className="text-gray-600 mb-4">
          You need at least one trained model to make predictions
        </p>
        <a
          href="/analysis"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Train a Model
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Model Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors text-left"
      >
        {selectedModel ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedModel.name}
                    {selectedModel.active_version_number && (
                      <span className="ml-2 text-sm text-gray-500">(v{selectedModel.active_version_number})</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span>{selectedModel.config?.algorithm || 'N/A'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-600 font-medium">
                      Target: {selectedModel.config?.target_column || 'N/A'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>{selectedModel.config?.feature_columns?.length || 0} features</span>
                  </div>
                </div>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-500">Select a trained model...</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model);
                  setIsOpen(false);
                }}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                  selectedModel?.id === model.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{model.name}</h4>
                      {model.active_version_number && (
                        <Badge variant="success">v{model.active_version_number}</Badge>
                      )}
                      {selectedModel?.id === model.id && (
                        <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {model.config?.algorithm || 'N/A'} • {model.config?.feature_columns?.length || 0} features
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useState } from 'react';