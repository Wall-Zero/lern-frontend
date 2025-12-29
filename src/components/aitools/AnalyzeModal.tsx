import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Dataset } from '../../types/dataset.types';

const analyzeSchema = z.object({
  data_source_id: z.number(),
  name: z.string().min(1, 'Name is required'),
  intent: z.string().optional(),
  ai_model: z.enum(['claude', 'gemini', 'gpt4']),
});

type AnalyzeFormData = z.infer<typeof analyzeSchema>;

interface AnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (data: AnalyzeFormData) => Promise<void>;
  datasets: Dataset[];
}

export const AnalyzeModal = ({ isOpen, onClose, onAnalyze, datasets }: AnalyzeModalProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AnalyzeFormData>({
    resolver: zodResolver(analyzeSchema),
    defaultValues: {
      ai_model: 'gemini',
    },
  });

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const datasetId = Number(e.target.value);
    setValue('data_source_id', datasetId);
    
    const dataset = datasets.find(d => d.id === datasetId);
    if (dataset && !watch('name')) {
      setValue('name', `${dataset.name} Analysis`);
    }
  };

  const onSubmit = async (data: AnalyzeFormData) => {
    setIsAnalyzing(true);
    try {
      await onAnalyze(data);
      handleClose();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analyze Dataset</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Dataset
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    onChange={handleDatasetChange}
                  >
                    <option value="">Choose a dataset</option>
                    {datasets.map((dataset) => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name} ({dataset.row_count} rows, {dataset.columns.length} columns)
                      </option>
                    ))}
                  </select>
                  {errors.data_source_id && (
                    <p className="mt-2 text-sm text-red-600">{errors.data_source_id.message}</p>
                  )}
                </div>

                <Input
                  label="Analysis Name"
                  placeholder="My Analysis"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Intent
                  </label>
                  <textarea
                    placeholder="What do you want to predict or analyze?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    {...register('intent')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Describing your goal helps the AI suggest better models
                  </p>
                </div>
{/*  
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    AI Model
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['claude', 'gemini', 'gpt4'].map((model) => (
                      <label
                        key={model}
                        className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          watch('ai_model') === model
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          value={model}
                          className="sr-only"
                          {...register('ai_model')}
                        />
                        <span className="font-medium capitalize">{model}</span>
                      </label>
                    ))}
                  </div>
                </div>
*/}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
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
