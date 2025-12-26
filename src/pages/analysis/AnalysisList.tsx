import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '../../components/layout/AppLayout';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { datasetsApi } from '../../api/endpoints/datasets';
import { AIToolCard } from '../../components/aitools/AIToolCard';
import { AnalyzeModal } from '../../components/aitools/AnalyzeModal';
import { Button } from '../../components/common/Button';
import type { AITool } from '../../types/aitools.types';
import type { Dataset } from '../../types/dataset.types';

export const AnalysisList = () => {
  const navigate = useNavigate();
  const [tools, setTools] = useState<AITool[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [toolsResponse, datasetsResponse] = await Promise.all([
        aitoolsApi.list(),
        datasetsApi.list(),
      ]);
      setTools(toolsResponse.results);
      setDatasets(datasetsResponse.results);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (data: any) => {
    await aitoolsApi.analyze(data);
    await loadData();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">AI Analysis Tools</h2>
            <p className="text-gray-600 mt-1">Create and manage ML model analysis</p>
          </div>
          <Button onClick={() => setIsAnalyzeModalOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            New Analysis
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No analysis tools yet</h3>
              <p className="text-gray-600 mb-6">Start analyzing your datasets with AI-powered ML models</p>
              <Button onClick={() => setIsAnalyzeModalOpen(true)}>
                Create Your First Analysis
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <AIToolCard
                key={tool.id}
                tool={tool}
                onClick={() => navigate(`/analysis/${tool.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <AnalyzeModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onAnalyze={handleAnalyze}
        datasets={datasets}
      />
    </AppLayout>
  );
};