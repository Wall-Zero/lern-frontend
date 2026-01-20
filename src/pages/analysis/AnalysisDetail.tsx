import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { datasetsApi } from '../../api/endpoints/datasets';
// Components
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

// Helper date formatter
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const AnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [tool, setTool] = useState<AITool | null>(null);
  const [datasetColumns, setDatasetColumns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'results'>('overview');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isActivatingVersion, setIsActivatingVersion] = useState(false);
  
  // SELECTED VERSION (The one we are viewing)
  const [selectedVersion, setSelectedVersion] = useState<any>(null);

  // Wizard State
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

  useEffect(() => {
    if (tool?.status === 'training') {
      const interval = setInterval(() => loadTool(true), 5000);
      return () => clearInterval(interval);
    }
  }, [tool?.status]);

  const loadTool = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await aitoolsApi.get(parseInt(id!));
      setTool(data);
      
      if (!silent) {
        setIsConfiguring(data.status === 'configuring');
        if (data.active_version_data) {
          setSelectedVersion(data.active_version_data);
        } else if (data.versions && data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
      } else {
        if (tool?.status === 'training' && data.status === 'trained') {
           setSelectedVersion(data.active_version_data);
           setIsConfiguring(false);
           setActiveTab('overview');
        }
      }
      
      if (data.data_source_id && !datasetColumns.length) {
        const cols = await datasetsApi.getColumns(data.data_source_id);
        if (cols.success) setDatasetColumns(cols.columns);
      }
      
      // Prefill config if needed
      if (data.analysis?.required_config && !targetColumn) {
         const c = data.analysis.required_config;
         setTargetColumn(c.target_column || '');
         setHasTemporalData(c.has_temporal_data || false);
         setTrainTestSplit(c.train_test_split || 0.8);
         if (c.feature_columns) {
            setSelectedFeatures(c.feature_columns.map((f:any) => f.name));
            setTemporalColumn('featureNames');
         }
      }
      
      if (data.analysis?.approaches?.[0] && !selectedAlgorithm) {
         setSelectedAlgorithm(data.analysis.approaches[0]);
         setHyperparameters(data.analysis.approaches[0].hyperparameters || {});
      }

    } catch (error) {
      if (!silent) showErrorToast('Failed to load analysis');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleActivateVersion = async (versionId: number) => {
    setIsActivatingVersion(true);
    console.log('Activating version', versionId);
    try {
      await aitoolsApi.setActiveVersion(parseInt(id!), versionId);
      showSuccessToast('Version activated successfully');
      await loadTool(); 
    } catch (error) {
      showErrorToast('Failed to activate version');
    } finally {
      setIsActivatingVersion(false);
    }
  };

  const handleInspectVersion = (version: any) => {
    setSelectedVersion(version);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReconfigure = () => {
    setIsConfiguring(true);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
     if (currentStep === 1 && !selectedAlgorithm) return showErrorToast('Select an algorithm');
     if (currentStep === 2 && (!targetColumn || !selectedFeatures.length)) return showErrorToast('Select target & features');
     setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const handlePreviousStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleConfigure = async () => {
     setIsSubmitting(true);
     try {
       const configData = {
           approach_index: tool?.analysis?.approaches?.findIndex((a:any) => a.algorithm === selectedAlgorithm.algorithm) || 0,
           target_column: targetColumn,
           feature_columns: selectedFeatures,
           hyperparameters,
           has_temporal_data: hasTemporalData,
           temporal_column: hasTemporalData ? temporalColumn : null,
           train_test_split: trainTestSplit,
       };
       await aitoolsApi.configure(parseInt(id!), configData);
       showSuccessToast('Starting training...');
       await aitoolsApi.trainDirect(parseInt(id!));
       await loadTool();
       setIsConfiguring(false);
     } catch(e) { showErrorToast('Failed to train'); } 
     finally { setIsSubmitting(false); }
  };

  if (isLoading || !tool) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  const isInspectingActive = selectedVersion?.id === tool.active_version_data?.id;
  const metrics = selectedVersion?.metrics;

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* TOP HEADER */}
        <div className="mb-6">
          <button onClick={() => navigate('/analysis')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Analysis
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{tool.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Dataset: {tool.data_source_name}</span>
                {tool.ai_model && <span className="capitalize">• {tool.ai_model}</span>}
              </div>
            </div>
            <div className="flex gap-2">
                {tool.status === 'trained' ? <Badge variant="success">Trained</Badge> : <Badge variant="yellow">{tool.status}</Badge>}
                {tool.status === 'trained' && <Badge variant="outline">v{tool.active_version_number}</Badge>}
            </div>
          </div>
        </div>

        {/* TABS - Only show when NOT configuring/training */}
        {!isConfiguring && tool.status !== 'training' && (
             <div className="flex gap-8 border-b border-gray-200 mb-6">
             <button
                 onClick={() => setActiveTab('overview')}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
                 Overview & Metrics
             </button>
             <button
                 onClick={() => setActiveTab('results')}
                 className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'results' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             >
                 Detailed Results
             </button>
             </div>
        )}

        {/* MAIN CONTENT AREA WITH ANIMATIONS */}
        <AnimatePresence mode="wait">
          
          {/* 1. CONFIGURATION VIEW */}
          {(isConfiguring || tool.status === 'configuring') && (
             <motion.div 
                key="configuration"
                {...pageVariants}
                className="space-y-6"
             >
                <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Configure Model</h2>
                            <p className="text-sm text-gray-500">Setup your machine learning parameters</p>
                        </div>
                        {tool.status !== 'configuring' && (
                            <Button variant="outline" size="sm" onClick={() => setIsConfiguring(false)}>Cancel</Button>
                        )}
                    </div>
                    
                    <WizardStepper steps={[{number:1,label:'Algorithm'},{number:2,label:'Features'},{number:3,label:'Training'}]} currentStep={currentStep} />
                    
                    <div className="mt-8">
                        {currentStep === 1 && (
                             <div className="space-y-4">
                                {tool.analysis?.approaches?.slice(0,3).map((a:any, i:number) => (
                                    <AlgorithmCard key={i} algorithm={a} isRecommended={i===0} isSelected={selectedAlgorithm?.algorithm===a.algorithm} onClick={()=>setSelectedAlgorithm(a)} />
                                ))}
                                <div className="flex justify-end pt-4"><Button onClick={handleNextStep}>Next</Button></div>
                             </div>
                        )}
                        {currentStep === 2 && (
                             <div>
                                <FeatureSelector features={datasetColumns} selectedFeatures={selectedFeatures} targetColumn={targetColumn} temporalColumn={temporalColumn} hasTemporalData={hasTemporalData} onFeaturesChange={setSelectedFeatures} onTargetChange={setTargetColumn} onTemporalChange={setTemporalColumn} onHasTemporalChange={setHasTemporalData} />
                                <div className="flex justify-between pt-6"><Button variant="secondary" onClick={handlePreviousStep}>Back</Button><Button onClick={handleNextStep}>Next</Button></div>
                             </div>
                        )}
                        {currentStep === 3 && (
                             <div>
                                <TrainingConfig trainTestSplit={trainTestSplit} hyperparameters={hyperparameters} onSplitChange={setTrainTestSplit} onHyperparametersChange={setHyperparameters} />
                                <div className="flex justify-between pt-6"><Button variant="secondary" onClick={handlePreviousStep}>Back</Button><Button disabled={isSubmitting} onClick={handleConfigure}>{isSubmitting?'Training...':'Start Training'}</Button></div>
                             </div>
                        )}
                    </div>
                </div>
             </motion.div>
          )}

          {/* 2. TRAINING VIEW */}
          {!isConfiguring && tool.status === 'training' && (
             <motion.div 
                key="training" 
                {...pageVariants}
                className="bg-white rounded-xl border border-gray-200 p-12 text-center"
             >
                 <Spinner size="lg" />
                 <h3 className="mt-4 text-xl font-bold text-gray-900">Training in progress...</h3>
                 <p className="text-gray-500">Please wait while we build your model.</p>
                 <div className="mt-6 max-w-md mx-auto bg-gray-100 rounded-full h-2 overflow-hidden">
                    <motion.div 
                        className="h-full bg-purple-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 15, ease: "linear" }}
                    />
                 </div>
             </motion.div>
          )}

          {/* 3. OVERVIEW TAB */}
          {
          !isConfiguring && tool.status === 'trained' && selectedVersion && (
            activeTab === 'overview' ? (
             <motion.div 
                key="overview" 
                {...pageVariants}
                className="space-y-6"
             >
                {/* Active Version Summary Card */}
                <div className={`rounded-xl border p-1 ${!isInspectingActive ? 'bg-yellow-50 border-yellow-200' : 'bg-purple-50 border-purple-100'}`}>
                    <div className="bg-white/50 rounded-lg p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${!isInspectingActive ? 'bg-yellow-100 text-yellow-600' : 'bg-green-500 text-white'}`}>
                                    {isInspectingActive ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Version {selectedVersion.version_number}</h2>
                                    <p className="text-gray-600 text-sm">
                                        {isInspectingActive ? 'Active Model' : 'Inactive / Historical Model'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                {!isInspectingActive && (
                                    <Button 
                                        onClick={() => handleActivateVersion(selectedVersion.id)} 
                                        disabled={isActivatingVersion}
                                        variant="primary"
                                    >
                                        {isActivatingVersion ? 'Activating...' : 'Set as Active'}
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={handleReconfigure} className='flex items-center'>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Retrain Model
                                </Button>
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-purple-600">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">ALGORITHM</span>
                                </div>
                                <div className="font-bold text-gray-900 truncate" title={selectedVersion.model_algorithm}>
                                    {selectedVersion.model_algorithm}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-green-600">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">R² SCORE</span>
                                </div>
                                <div className="font-bold text-green-600 text-xl">
                                    {metrics?.r2_score ? (metrics.r2_score * 100).toFixed(1) + '%' : 'N/A'}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-blue-600">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">TRAINED</span>
                                </div>
                                <div className="font-bold text-gray-900">
                                    {formatDate(selectedVersion.trained_at)}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-orange-600">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">RMSE</span>
                                </div>
                                <div className="font-bold text-gray-900 text-xl">
                                    {metrics?.rmse ? metrics.rmse.toFixed(3) : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

 
                {/* Config & Actions */}
                <div className="grid grid-cols-[60%_40%] gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4">Configuration Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-gray-500">Target</span>
                                <span className="font-medium">{selectedVersion.config_snapshot?.target_column}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-gray-500">Features</span>
                                <span className="font-medium">{selectedVersion.config_snapshot?.feature_columns?.length} columns</span>
                            </div>
                            <div className="flex justify-between text-sm py-2">
                                <span className="text-gray-500">Temporal Data</span>
                                <span className="font-medium">{selectedVersion.config_snapshot?.has_temporal_data ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4">Quick Actions</h4>
                        <div className="flex flex-col gap-2 h-[70%]">
                            <Button variant="flex" onClick={() => navigate(`/predictions?model=${tool.id}`)} className="flex-1 items-center justify-center bg-purple-600 hover:bg-purple-700 border-transparent">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Make Predictions
                            </Button>
                            <Button variant="secondary" onClick={() => setActiveTab('results')} className="flex-1 justify-center">
                                View Detailed Results
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Version History Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Version History</h3>
                        <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border">
                            {tool.versions?.length} Versions
                        </span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Algorithm</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">R² Score</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {tool.versions?.sort((a:any, b:any) => b.version_number - a.version_number).map((ver: any) => {
                                const isActive = ver.id === tool.active_version_data?.id;
                                const isSelected = ver.id === selectedVersion.id;
                                return (
                                    <tr 
                                        key={ver.id} 
                                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                                        onClick={() => handleInspectVersion(ver)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    v{ver.version_number}
                                                </div>
                                                {isActive && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Active</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {ver.model_algorithm}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {ver.metrics?.r2_score ? (ver.metrics.r2_score * 100).toFixed(1) + '%' : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(ver.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {isSelected ? (
                                                <span className="text-purple-600 font-medium text-xs">Viewing</span>
                                            ) : (
                                                <button className="text-gray-400 hover:text-purple-600 font-medium text-xs transition-colors">
                                                    View Details
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

             </motion.div>
          ) : (
             /* 4. DETAILED RESULTS TAB */
             <motion.div 
                key="results" 
                {...pageVariants}
                className="space-y-6"
             >
                 {/* Feature Importance Bar Chart */}
                                {/* Performance Metrics Row */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h4 className="text-gray-900 font-bold mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase font-medium">MAE</span>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics?.mae?.toFixed(3)}</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase font-medium">MSE</span>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics?.mse?.toFixed(3)}</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase font-medium">RMSE</span>
                            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics?.rmse?.toFixed(3)}</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-xs text-green-700 uppercase font-medium">R² Score</span>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {metrics?.r2_score ? (metrics.r2_score * 100).toFixed(1) + '%' : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                 {metrics?.feature_importance && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Feature Importance</h3>
                                <p className="text-gray-500 text-sm mt-1">Impact of features on version {selectedVersion.version_number}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(metrics.feature_importance)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 10)
                                .map(([feature, imp], idx) => (
                                    <div key={feature} className="relative">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{idx+1}. {feature}</span>
                                            <span className="font-bold text-gray-900">{((imp as number)*100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(imp as number) * 100}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                 )}
                 {/* Export Model Card */}
                 <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Export Model</h4>
                            <p className="text-sm text-gray-600 mb-4">Download your trained model in ONNX format for deployment.</p>
                        </div>
                        {selectedVersion.onnx_model_url && (
                             <a href={selectedVersion.onnx_model_url} download className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Model
                             </a>
                        )}
                    </div>
                 </div>
             </motion.div>
          )
          )
          }
        </AnimatePresence>
      </div>
    </>
  );
};