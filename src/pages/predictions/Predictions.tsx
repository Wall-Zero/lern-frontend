import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { Toaster } from 'react-hot-toast';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { predictionsApi } from '../../api/endpoints/predictions';
import { ModelSelector } from '../../components/predictions/ModelSelector';
import { FileUpload } from '../../components/predictions/FileUpload';
import { DataPreview } from '../../components/predictions/DataPreview';
import { PredictionResults } from '../../components/predictions/PredictionResults';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { showSuccessToast, showErrorToast } from '../../lib/toast';
import type { AITool } from '../../types/aitools.types';
import type { PredictionResult } from '../../api/endpoints/predictions';

export const Predictions = () => {
  const [searchParams] = useSearchParams();
  const preSelectedModelId = searchParams.get('model');

  const [models, setModels] = useState<AITool[]>([]);
  const [selectedModel, setSelectedModel] = useState<AITool | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[] | null>(null);

  // Load trained models
  useEffect(() => {
    loadModels();
  }, []);

  // Pre-select model if coming from URL param
  useEffect(() => {
    if (preSelectedModelId && models.length > 0) {
      const model = models.find(m => m.id === parseInt(preSelectedModelId));
      if (model) {
        setSelectedModel(model);
      }
    }
  }, [preSelectedModelId, models]);

  const loadModels = async () => {
    try {
      const response = await aitoolsApi.list({ status: 'trained' });
      console.log('Loaded models:', response.results);
      setModels(response.results);
    } catch (error) {
      console.error('Failed to load models:', error);
      showErrorToast('Failed to load trained models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setPredictions(null); // Clear previous predictions

    // Parse CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
      },
      error: (error) => {
        showErrorToast(`Failed to parse CSV: ${error.message}`);
        setUploadedFile(null);
      },
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedData([]);
  };

  const handlePredict = async () => {
    if (!selectedModel || !uploadedFile) return;

    setIsPredicting(true);
    try {
      const response = await predictionsApi.predict(selectedModel.id, uploadedFile);
      
      if (response.success && response.predictions) {
        setPredictions(response.predictions);
        showSuccessToast(`Successfully predicted ${response.predictions.length} rows!`);
      } else {
        throw new Error(response.error || 'Prediction failed');
      }
    } catch (error: any) {
      console.error('Prediction failed:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Prediction failed';
      showErrorToast(errorMessage);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!predictions || !selectedModel) return;

    // Convert predictions to CSV format
    const csvData = predictions.map((pred) => ({
      ...pred.input,
      [`Predicted_${pred.target_column}`]: pred.prediction,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictions_${selectedModel.name}_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccessToast('CSV downloaded successfully');
  };

  const handleDownloadJSON = () => {
    if (!predictions || !selectedModel) return;

    const json = JSON.stringify(predictions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictions_${selectedModel.name}_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccessToast('JSON downloaded successfully');
  };

  const handleStartNew = () => {
    setPredictions(null);
    setUploadedFile(null);
    setParsedData([]);
    setSelectedModel(null);
  };

  // Validation
  console.log('Selected Model:', selectedModel);
  const requiredColumns = (selectedModel?.config_snapshot?.feature_columns || []) as string[];
  const providedColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  const missingColumns = requiredColumns.filter(col => !providedColumns.includes(col));
  const canPredict = selectedModel && parsedData.length > 0 && missingColumns.length === 0 && !isPredicting;

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Predictions</h2>
            <p className="text-gray-600 mt-1">Make predictions with your trained models</p>
          </div>
          {/* Future: History button */}
          {/* <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </Button> */}
        </div>

        <AnimatePresence mode="wait">
          {predictions ? (
            /* Step 4: Show Results */
            <PredictionResults
              key="results"
              predictions={predictions}
              modelName={selectedModel?.name || ''}
              targetColumn={predictions[0]?.target_column || ''}
              onDownloadCSV={handleDownloadCSV}
              onDownloadJSON={handleDownloadJSON}
              onStartNew={handleStartNew}
            />
          ) : (
            /* Steps 1-3: Configuration Flow */
            <motion.div
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Step 1: Select Model */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Model</h3>
                </div>
                
                <ModelSelector
                  models={models}
                  selectedModel={selectedModel}
                  onSelect={setSelectedModel}
                  isLoading={isLoadingModels}
                />

                {selectedModel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Required Features ({requiredColumns.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {requiredColumns.map((col) => (
                        <span
                          key={col}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      💡 Your CSV must include all these columns with exact names
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Step 2: Upload Data */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    selectedModel 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Your Data</h3>
                </div>

                {!uploadedFile ? (
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept=".csv"
                    disabled={!selectedModel}
                  />
                ) : (
                  <DataPreview
                    data={parsedData}
                    requiredColumns={requiredColumns}
                    fileName={uploadedFile.name}
                    onRemove={handleRemoveFile}
                  />
                )}
              </div>

              {/* Step 3: Generate Predictions */}
              {uploadedFile && parsedData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      canPredict 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      3
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Generate Predictions</h3>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    {missingColumns.length > 0 ? (
                      <p className="text-sm text-red-600">
                        Cannot proceed: {missingColumns.length} required column{missingColumns.length > 1 ? 's are' : ' is'} missing
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        ✓ Ready to predict {parsedData.length} rows
                      </p>
                    )}

                    <Button
                      variant="flex"
                      onClick={handlePredict}
                      disabled={!canPredict}
                      className="min-w-[300px] gap-2"
                    >
                      {isPredicting ? (
                        <span className="flex items-center gap-2">
                          <Spinner size="sm" />
                          Predicting {parsedData.length} rows...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Predictions
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};