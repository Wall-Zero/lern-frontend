import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { datasetsApi } from '../../api/endpoints/datasets';
import { AIToolCard } from '../../components/analysis/AIToolCard';
import { AnalyzeModal } from '../../components/analysis/AnalyzeModal';
import { Button } from '../../components/common/Button';
import { showSuccessToast } from '../../lib/toast';
import { usePolling } from '../../context/PollingContext';
import type { AITool } from '../../types/aitools.types';
import type { Dataset } from '../../types/dataset.types';

export const AnalysisList = () => {
  const navigate = useNavigate();
  const { tools, refreshTools, startAggressivePolling } = usePolling();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [optimisticTools, setOptimisticTools] = useState<AITool[]>([]);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const datasetsResponse = await datasetsApi.list();
      setDatasets(datasetsResponse.results);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (data: any) => {
    try {
      // Create optimistic tool for immediate UI feedback
      const optimisticTool: Partial<AITool> = {
        id: -Date.now(),
        name: data.name,
        description: '',
        tool_type: 'ml_model',
        status: 'analyzing',
        intent: data.intent,
        ai_model: data.ai_model,
        data_source_id: data.data_source_id,
        data_source_name: datasets.find((d) => d.id === data.data_source_id)?.name || '',
        version_count: 0,
        active_version_number: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        config: {},
      };

      // Add to optimistic tools
      setOptimisticTools((prev) => [optimisticTool as AITool, ...prev]);
      
      // Close modal
      setIsAnalyzeModalOpen(false);
      
      // Show toast
      showSuccessToast('Analysis started! We\'ll notify you when it\'s ready.');

      // Start aggressive polling
      startAggressivePolling();

      // Make API call
      await aitoolsApi.analyze(data);
      
      // Clear optimistic tools BEFORE refresh to prevent duplicates
      setOptimisticTools([]);
      
      // Refresh to get real data
      await refreshTools();
    } catch (error) {
      console.error('Failed to start analysis:', error);
      // Remove optimistic tool on error
      setOptimisticTools((prev) => prev.filter((t) => t.id !== optimisticTool.id));
    }
  };

  // Combine real tools with optimistic tools, avoiding duplicates
  const allTools = (() => {
    const realTools = tools.filter(t => t.id > 0);
    
    // Only show optimistic tools if they don't have a real counterpart yet
    const validOptimisticTools = optimisticTools.filter(opt => 
      !realTools.some(real => real.name === opt.name)
    );
    
    return [...validOptimisticTools, ...realTools];
  })();

  const filteredTools = allTools.filter((tool) => {
    if (filter === 'all') return true;
    return tool.status === filter;
  });

  const filters = [
    {
      value: 'all',
      label: 'All',
      count: allTools.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      value: 'analyzing',
      label: 'Analyzing',
      count: allTools.filter((t) => t.status === 'analyzing').length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      value: 'configuring',
      label: 'Configuring',
      count: allTools.filter((t) => t.status === 'configuring').length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      value: 'training',
      label: 'Training',
      count: allTools.filter((t) => t.status === 'training').length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      value: 'trained',
      label: 'Trained',
      count: allTools.filter((t) => t.status === 'trained').length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Analysis Tools</h2>
          <p className="text-gray-600 mt-1">Create and manage ML model analysis</p>
        </div>
        <Button onClick={() => setIsAnalyzeModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Button>
      </div>

      {/* Filters */}
      {allTools.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {filters.map((f) => (
            <motion.button
              key={f.value}
              onClick={() => setFilter(f.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === f.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                filter === f.value
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {f.count}
              </span>
            </motion.button>
          ))}
        </div>
      )}

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
      ) : filteredTools.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No analysis tools yet' : `No ${filter} analysis`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? 'Start analyzing your datasets with AI-powered ML models'
              : 'Try a different filter or create a new analysis'}
          </p>
          <Button onClick={() => setIsAnalyzeModalOpen(true)}>
            Create Your First Analysis
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <AIToolCard
              key={tool.id}
              tool={tool}
              onClick={() => navigate(`/analysis/${tool.id}`)}
            />
          ))}
        </div>
      )}

      <AnalyzeModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onAnalyze={handleAnalyze}
        datasets={datasets}
      />
    </div>
  );
};