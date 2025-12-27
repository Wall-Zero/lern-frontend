import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '../../components/layout/AppLayout';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { ConfigureModal } from '../../components/aitools/ConfigureModal';
import { ConfigurationSummary } from '../../components/aitools/ConfigurationSummary';
import { GeneratedCodeView } from '../../components/aitools/GeneratedCodeView';
import { FeasibilityCard } from '../../components/aitools/FeasibilityCard';
import { ApproachesCard } from '../../components/aitools/ApproachesCard';
import { TrainingMetrics } from '../../components/aitools/TrainingMetrics';
import { FeatureImportance } from '../../components/aitools/FeatureImportance';
import { VersionsList } from '../../components/aitools/VersionsList';
import { Button } from '../../components/common/Button';
import type { AITool, Approach } from '../../types/aitools.types';

type TabType = 'configuration' | 'training';

export const AnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tool, setTool] = useState<AITool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [selectedApproach, setSelectedApproach] = useState<Approach | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('configuration');

  useEffect(() => {
    loadTool();
  }, [id]);

  useEffect(() => {
    const approachParam = searchParams.get('approach');
    if (approachParam && tool?.analysis?.approaches) {
      const approach = tool.analysis.approaches.find(a => a.algorithm === approachParam);
      if (approach) {
        setSelectedApproach(approach);
        setIsConfigureModalOpen(true);
      }
    }
  }, [searchParams, tool]);

  const loadTool = async () => {
    try {
      const data = await aitoolsApi.get(Number(id));
      setTool(data);
    } catch (error) {
      console.error('Failed to load tool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = async (configData: any) => {
    await aitoolsApi.configure(Number(id), configData);
    await loadTool();
  };

  const handleConfigureClick = (approach: Approach) => {
    setSelectedApproach(approach);
    setIsConfigureModalOpen(true);
  };

  const handleReconfigure = () => {
    const currentApproach = tool?.analysis?.approaches.find(
      a => a.algorithm === tool?.config?.algorithm
    ) || tool?.analysis?.approaches[0];
    
    if (currentApproach) {
      setSelectedApproach(currentApproach);
      setIsConfigureModalOpen(true);
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      await aitoolsApi.generateCode(Number(id));
      await loadTool();
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    try {
      await aitoolsApi.train(Number(id));
      await loadTool();
      setActiveTab('training');
    } catch (error) {
      console.error('Failed to train model:', error);
    } finally {
      setIsTraining(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (!tool) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis not found</h2>
            <Button onClick={() => navigate('/analysis')}>Back to Analysis</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analysis
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
              <p className="text-gray-600 mt-1">Dataset: {tool.data_source_name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tool.status === 'trained' ? 'bg-green-100 text-green-700' :
              tool.status === 'code_ready' ? 'bg-purple-100 text-purple-700' :
              tool.status === 'configured' ? 'bg-blue-100 text-blue-700' :
              tool.status === 'configuring' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tool.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('configuration')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'configuration'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Configuration & Analysis
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'training'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Training & Versions
              {tool.versions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                  {tool.versions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'configuration' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <ConfigurationSummary
                tool={tool}
                onReconfigure={handleReconfigure}
                onGenerateCode={handleGenerateCode}
                isGeneratingCode={isGeneratingCode}
              />

              {tool.generated_code && tool.code_generated_at && (
                <>
                  <GeneratedCodeView
                    code={tool.generated_code}
                    generatedAt={tool.code_generated_at}
                  />
                  {tool.status === 'code_ready' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        onClick={handleTrain}
                        isLoading={isTraining}
                        className="w-full flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {isTraining ? 'Training Model...' : 'Train Model'}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              {tool.analysis && <FeasibilityCard analysis={tool.analysis} />}

              {tool.analysis?.warnings && tool.analysis.warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Warnings
                  </h3>
                  <ul className="space-y-2">
                    {tool.analysis.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-yellow-800">{warning}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {tool.analysis?.recommendations && tool.analysis.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {tool.analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800">{rec}</li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {tool.analysis?.approaches && tool.analysis.approaches.length > 0 && (
                <ApproachesCard
                  approaches={tool.analysis.approaches}
                  currentAlgorithm={tool.config?.algorithm}
                  status={tool.status}
                  onConfigureClick={handleConfigureClick}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-6">
            {tool.active_version_data ? (
              <>
                <TrainingMetrics
                  metrics={tool.active_version_data.metrics}
                  trainingDuration={tool.active_version_data.training_duration}
                  trainingSamples={tool.active_version_data.training_samples}
                  testSamples={tool.active_version_data.test_samples}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FeatureImportance importance={tool.active_version_data.feature_importance} />
                  <VersionsList versions={tool.versions} activeVersion={tool.active_version_number} />
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No training data yet</h3>
                  <p className="text-gray-600 mb-6">Train your model to see metrics and versions</p>
                  {tool.status === 'code_ready' && (
                    <Button onClick={handleTrain} isLoading={isTraining}>
                      Train Model
                    </Button>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedApproach && (
        <ConfigureModal
          isOpen={isConfigureModalOpen}
          onClose={() => setIsConfigureModalOpen(false)}
          onConfigure={handleConfigure}
          tool={tool}
          selectedApproach={selectedApproach}
        />
      )}
    </AppLayout>
  );
};