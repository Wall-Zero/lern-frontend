import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import type { AITool } from '../../types/aitools.types';

interface ConfigurationSummaryProps {
  tool: AITool;
  onReconfigure: () => void;
  onGenerateCode: () => void;
  isGeneratingCode: boolean;
}

export const ConfigurationSummary = ({ 
  tool, 
  onReconfigure, 
  onGenerateCode,
  isGeneratingCode 
}: ConfigurationSummaryProps) => {
  if (!tool.config || Object.keys(tool.config).length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-green-900 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Model Configured
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReconfigure} className="text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Reconfigure
          </Button>
          {tool.status === 'configured' && (
            <Button onClick={onGenerateCode} isLoading={isGeneratingCode} className="text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              {isGeneratingCode ? 'Generating...' : 'Generate Code'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <p className="text-green-700 font-medium">Algorithm</p>
          <p className="text-green-900">{tool.config.selected_approach}</p>
        </div>
        <div>
          <p className="text-green-700 font-medium">Target Column</p>
          <p className="text-green-900">{tool.config.target_column}</p>
        </div>
        <div>
          <p className="text-green-700 font-medium">Features</p>
          <p className="text-green-900">{tool.config.feature_columns?.length || 0} columns</p>
        </div>
      </div>

      <div className="pt-4 border-t border-green-200">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-green-700 font-medium">Train/Test Split</p>
            <p className="text-green-900">
              {((tool.config.train_test_split || 0.8) * 100).toFixed(0)}% / 
              {((1 - (tool.config.train_test_split || 0.8)) * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-green-700 font-medium">Temporal Data</p>
            <p className="text-green-900">{tool.config.has_temporal_data === 'True' ? 'Yes' : 'No'}</p>
          </div>
          {tool.config.temporal_column && (
            <div>
              <p className="text-green-700 font-medium">Temporal Column</p>
              <p className="text-green-900">{tool.config.temporal_column}</p>
            </div>
          )}
          <div>
            <p className="text-green-700 font-medium">Random State</p>
            <p className="text-green-900">{tool.config.random_state || 42}</p>
          </div>
        </div>
      </div>

      {tool.config.hyperparameters && Object.keys(tool.config.hyperparameters).length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-800">
            View Hyperparameters
          </summary>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {Object.entries(tool.config.hyperparameters).map(([key, value]) => (
              <div key={key} className="text-sm">
                <p className="text-green-700 font-medium">{key.replace(/_/g, ' ')}</p>
                <p className="text-green-900">{String(value)}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </motion.div>
  );
};