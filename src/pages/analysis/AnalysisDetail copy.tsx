import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { datasetsApi } from '../../api/endpoints/datasets';
import { WizardStepper } from '../../components/analysis/WizardStepper';
import { WarningCollapsible } from '../../components/analysis/WarningCollapsible';
import { AlgorithmCard } from '../../components/analysis/AlgorithmCard';
import { FeatureSelector } from '../../components/analysis/FeatureSelector';
import { TrainingConfig } from '../../components/analysis/TrainingConfig';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { showSuccessToast, showErrorToast } from '../../lib/toast';
import type { AITool } from '../../types/aitools.types';

export const AnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [tool, setTool] = useState<AITool | null>(null);
  const [datasetColumns, setDatasetColumns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs management
  const [activeTab, setActiveTab] = useState<'overview' | 'results'>('overview');
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // Wizard state (From Original Version - The robust one)
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [temporalColumn, setTemporalColumn] = useState('');
  const [hasTemporalData, setHasTemporalData] = useState(false);
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [hyperparameters, setHyperparameters] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTool();
  }, [id]);

  // Auto-refresh when training
  useEffect(() => {
    if (tool?.status === 'training') {
      const interval = setInterval(() => {
        loadTool();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tool?.status]);

  const loadTool = async () => {
    try {
      const data = await aitoolsApi.get(parseInt(id!));
      setTool(data);
      
      // Determine initial state
      if (data.status === 'configuring') {
        setIsConfiguring(true);
      } else {
        setIsConfiguring(false);
      }
      
      // Load dataset columns
      if (data.data_source_id) {
        try {
          const columnsResponse = await datasetsApi.getColumns(data.data_source_id);
          if (columnsResponse.success && columnsResponse.columns) {
            setDatasetColumns(columnsResponse.columns);
          }
        } catch (error) {
          console.error('Failed to load dataset columns:', error);
        }
      }
      
      // Initialize form from analysis data (Original Logic)
      if (data.analysis?.required_config) {
        const config = data.analysis.required_config;
        
        if (config.target_column) setTargetColumn(config.target_column);
        setHasTemporalData(config.has_temporal_data || false);
        setTrainTestSplit(config.train_test_split || 0.8);
        
        if (config.feature_columns && Array.isArray(config.feature_columns)) {
          const featureNames = config.feature_columns.map((f: any) => f.name);
          setSelectedFeatures(featureNames);
          setTemporalColumn('featureNames'); // Keeps original placeholder logic
        }
      }
      
      // Set first recommended algorithm as default if not set
      if (data.analysis?.approaches?.[0] && !selectedAlgorithm) {
        setSelectedAlgorithm(data.analysis.approaches[0]);
        setHyperparameters(data.analysis.approaches[0].hyperparameters || {});
      }

    } catch (error) {
      console.error('Failed to load tool:', error);
      showErrorToast('Failed to load analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // --- WIZARD LOGIC (Keep Intact from Original) ---
  const handleAlgorithmSelect = (algorithm: any) => {
    setSelectedAlgorithm(algorithm);
    setHyperparameters(algorithm.hyperparameters || {});
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAlgorithm) {
      showErrorToast('Please select an algorithm');
      return;
    }
    if (currentStep === 2 && (!targetColumn || selectedFeatures.length === 0)) {
      showErrorToast('Please select target column and at least one feature');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfigure = async () => {
    if (!selectedAlgorithm || !targetColumn || selectedFeatures.length === 0) {
      showErrorToast('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const configData = {
        approach_index: tool?.analysis?.approaches?.findIndex(
          (a: any) => a.algorithm === selectedAlgorithm.algorithm
        ) || 0,
        target_column: targetColumn,
        feature_columns: selectedFeatures,
        hyperparameters,
        has_temporal_data: hasTemporalData,
        temporal_column: hasTemporalData ? temporalColumn : null,
        train_test_split: trainTestSplit,
      };

      await aitoolsApi.configure(parseInt(id!), configData);
      showSuccessToast('Model configured! Starting training...');
      
      // Auto-trigger training
      await aitoolsApi.trainDirect(parseInt(id!));
      
      // Reload tool data
      await loadTool();
      setIsConfiguring(false); // Switch to view mode
    } catch (error) {
      console.error('Failed to configure model:', error);
      showErrorToast('Failed to configure model');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconfigure = () => {
    setIsConfiguring(true);
    setCurrentStep(1);
    // Note: We keep the previous state so the user can edit instead of starting from scratch
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Analysis not found</p>
      </div>
    );
  }

  const steps = [
    { number: 1, label: 'Choose Algorithm' },
    { number: 2, label: 'Select Features' },
    { number: 3, label: 'Configure Training' },
  ];

  // Data helpers for the "Pretty" UI
  const activeVersion = tool.active_version_data;
  const metrics = activeVersion?.metrics;

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header - Hybrid Style (Clean badges from Copy version) */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analysis
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 text-sm">Dataset: {tool.data_source_name}</span>
                {tool.ai_model && (
                   <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 capitalize">{tool.ai_model}</span>
                   </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={
                  tool.status === 'trained' ? 'success' : 
                  tool.status === 'training' ? 'orange' : 'yellow'
                }
              >
                {tool.status === 'trained' ? 'Trained' :
                 tool.status === 'training' ? 'Training' : 'Configuring'}
              </Badge>
              {tool.status === 'trained' && (
                <Badge variant="default">v{tool.active_version_number || 1}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT SWITCHER --- */}

        <AnimatePresence mode="wait">
          
          {/* STATE 1: CONFIGURATION (The robust Original Logic) */}
          {(isConfiguring || tool.status === 'configuring') && (
            <motion.div
              key="configuration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
               {/* Wizard Header added for context */}
               <div className="flex justify-between items-center mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {tool.status === 'trained' ? 'Retrain Model' : 'Configure Model'}
                    </h2>
                    <p className="text-gray-600 text-sm">Follow the steps to setup your analysis</p>
                  </div>
                  {tool.status === 'trained' && (
                    <Button variant="outline" onClick={() => setIsConfiguring(false)} size="sm">
                      Cancel
                    </Button>
                  )}
               </div>

              {/* Original Wizard Stepper */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <WizardStepper steps={steps} currentStep={currentStep} />
              </div>

              {/* Warnings */}
              {tool.analysis?.warnings && (
                <WarningCollapsible warnings={tool.analysis.warnings} />
              )}

              {/* Step Content Container */}
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                
                {/* Step 1: Choose Algorithm (Original) */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Recommended Approaches
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {tool.analysis?.approaches?.slice(0, 3).map((approach: any, index: number) => (
                        <AlgorithmCard
                          key={approach.algorithm}
                          algorithm={approach}
                          isRecommended={index === 0}
                          isSelected={selectedAlgorithm?.algorithm === approach.algorithm}
                          onClick={() => handleAlgorithmSelect(approach)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Select Features (Original) */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Select Features</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <Badge variant="purple" size="sm">Selected Algorithm</Badge>
                        <span>{selectedAlgorithm?.name}</span>
                      </div>
                    </div>
                    
                    <FeatureSelector
                      features={datasetColumns} // Note: original used 'features', copy used 'columns' prop name. Using original prop.
                      selectedFeatures={selectedFeatures}
                      targetColumn={targetColumn}
                      temporalColumn={temporalColumn}
                      hasTemporalData={hasTemporalData}
                      onFeaturesChange={setSelectedFeatures}
                      onTargetChange={setTargetColumn}
                      onTemporalChange={setTemporalColumn}
                      onHasTemporalChange={setHasTemporalData}
                    />
                  </motion.div>
                )}

                {/* Step 3: Configure Training (Original) */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Configure Training
                    </h3>
                    <TrainingConfig
                      trainTestSplit={trainTestSplit}
                      hyperparameters={hyperparameters}
                      onSplitChange={setTrainTestSplit}
                      onHyperparametersChange={setHyperparameters}
                    />
                  </motion.div>
                )}

                {/* Navigation Buttons (Original Logic) */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </Button>

                  {currentStep < 3 ? (
                    <Button variant="primary" onClick={handleNextStep}>
                      Next Step
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleConfigure}
                      disabled={isSubmitting}
                      className="min-w-[200px]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Spinner size="sm" />
                          Configuring...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Configure & Train Model
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 2: TRAINING (Improved Visuals from Copy) */}
          {!isConfiguring && tool.status === 'training' && (
             <motion.div
             key="training"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="bg-white rounded-xl border border-gray-200 p-8"
           >
             <div className="flex items-center gap-3 mb-6">
               <svg className="w-6 h-6 text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               <h3 className="text-xl font-bold text-gray-900">Training Model...</h3>
             </div>

             <div className="space-y-4">
               <div className="flex items-center justify-between text-sm">
                 <span className="text-gray-700 font-medium">Progress</span>
                 <span className="text-gray-600">Training in progress</span>
               </div>
               
               <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                 <motion.div
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-orange-600"
                   initial={{ width: '0%' }}
                   animate={{ width: '70%' }}
                   transition={{ duration: 2, ease: 'easeOut' }}
                 />
                 <motion.div
                   className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                   animate={{ x: ['0%', '400%'] }}
                   transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                 />
               </div>

               <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                 <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-sm text-blue-700">
                   Training typically takes 1-3 minutes. This page will auto-refresh.
                 </p>
               </div>
             </div>
           </motion.div>
          )}

          {/* STATE 3: TRAINED/OVERVIEW (The Pretty UI from Copy) */}
          {!isConfiguring && tool.status === 'trained' && activeVersion && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Internal Tabs for Trained View */}
              <div className="border-b border-gray-200">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'overview'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Overview & Metrics
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${
                        activeTab === 'results'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Detailed Results
                    </button>
                </div>
              </div>

              {activeTab === 'overview' ? (
                <>
                  {/* Version Summary Card */}
                  <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-200 p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            Version {activeVersion.version_number}
                          </h3>
                          <p className="text-sm text-gray-600">Active Model</p>
                        </div>
                      </div>
                      
                      <Button variant="secondary" onClick={handleReconfigure}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retrain Model
                      </Button>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-600 uppercase">Algorithm</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {activeVersion.model_algorithm || selectedAlgorithm?.name || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-600 uppercase">R² Score</p>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                          {metrics?.r2_score ? (metrics.r2_score * 100).toFixed(1) + '%' : 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-600 uppercase">Trained</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {new Date(activeVersion.trained_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-600 uppercase">RMSE</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {metrics?.rmse ? metrics.rmse.toFixed(3) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {metrics && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">MAE</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics.mae?.toFixed(3) || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">MSE</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics.mse?.toFixed(3) || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">RMSE</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {metrics.rmse?.toFixed(3) || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">R² Score</p>
                          <p className="text-2xl font-bold text-green-600">
                            {metrics.r2_score ? (metrics.r2_score * 100).toFixed(1) + '%' : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Target</span>
                          <span className="text-sm font-medium text-gray-900">{tool.config?.target_column || targetColumn}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Features</span>
                          <span className="text-sm font-medium text-gray-900">
                            {tool.config?.feature_columns?.length || selectedFeatures.length} columns
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-gray-600">Temporal Data</span>
                          <span className="text-sm font-medium text-gray-900">
                            {tool.config?.has_temporal_data || hasTemporalData ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
                      <div className="space-y-3">
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => navigate('/predictions')}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Make Predictions
                        </Button>
                        <Button
                          variant="secondary"
                          fullWidth
                          onClick={() => setActiveTab('results')}
                        >
                           View Detailed Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Detailed Results Tab Content */
                <div className="space-y-6">
                    {/* Feature Importance */}
                    {metrics?.feature_importance && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Feature Importance</h3>
                        <div className="space-y-3">
                            {Object.entries(metrics.feature_importance)
                            .sort(([, a], [, b]) => (b as number) - (a as number))
                            .slice(0, 15)
                            .map(([feature, importance], index) => (
                                <div key={feature} className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500 w-6">{index + 1}</span>
                                <span className="text-sm font-medium text-gray-700 w-48 truncate">
                                    {feature}
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(importance as number) * 100}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                                    {((importance as number) * 100).toFixed(2)}%
                                </span>
                                </div>
                            ))}
                        </div>
                        </div>
                    )}

                    {/* Download Model */}
                    <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl border border-primary-200 p-6">
                        <div className="flex items-start justify-between">
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Export Model</h4>
                            <p className="text-sm text-gray-600 mb-4">
                            Download your trained model in ONNX format for deployment
                            </p>
                        </div>
                        {activeVersion.onnx_model_url && (
                            <a
                            href={activeVersion.onnx_model_url}
                            download
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Model
                            </a>
                        )}
                        </div>
                    </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
};