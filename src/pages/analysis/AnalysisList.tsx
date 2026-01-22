import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { aitoolsApi } from '../../api/endpoints/aitools';
import { datasetsApi } from '../../api/endpoints/datasets';
import { AnalyzeModal } from '../../components/analysis/AnalyzeModal';
import { Spinner } from '../../components/common/Spinner';
import { showSuccessToast } from '../../lib/toast';
import { usePolling } from '../../context/PollingContext';
import type { AITool } from '../../types/aitools.types';
import type { Dataset } from '../../types/dataset.types';

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'created_at' | 'status';
type SortOrder = 'asc' | 'desc';
type InterfaceMode = 'simple' | 'pro';

export const AnalysisList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tools, refreshTools, startAggressivePolling } = usePolling();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [preSelectedDatasetId, setPreSelectedDatasetId] = useState<number | null>(null);
  const [optimisticTools, setOptimisticTools] = useState<AITool[]>([]);

  // Interface mode
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>(() => {
    const saved = localStorage.getItem('analysis-interface-mode');
    return (saved as InterfaceMode) || 'simple';
  });

  // Pro mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    const datasetId = searchParams.get('dataset');
    if (datasetId && datasets.length > 0) {
      const id = parseInt(datasetId, 10);
      if (!isNaN(id)) {
        setPreSelectedDatasetId(id);
        setIsAnalyzeModalOpen(true);
        setSearchParams({});
      }
    }
  }, [searchParams, datasets]);

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

      setOptimisticTools((prev) => [optimisticTool as AITool, ...prev]);
      setIsAnalyzeModalOpen(false);
      setPreSelectedDatasetId(null);
      showSuccessToast('Analysis started! We\'ll notify you when it\'s ready.');
      startAggressivePolling();

      await aitoolsApi.analyze(data);
      setOptimisticTools([]);
      await refreshTools();
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setOptimisticTools((prev) => prev.filter((t) => t.id !== optimisticTools[0]?.id));
    }
  };

  const handleCloseModal = () => {
    setIsAnalyzeModalOpen(false);
    setPreSelectedDatasetId(null);
  };

  const toggleInterfaceMode = () => {
    const newMode = interfaceMode === 'simple' ? 'pro' : 'simple';
    setInterfaceMode(newMode);
    localStorage.setItem('analysis-interface-mode', newMode);
  };

  // Combine real tools with optimistic tools
  const allTools = useMemo(() => {
    const realTools = tools.filter(t => t.id > 0);
    const validOptimisticTools = optimisticTools.filter(opt =>
      !realTools.some(real => real.name === opt.name)
    );
    return [...validOptimisticTools, ...realTools];
  }, [tools, optimisticTools]);

  // Stats
  const stats = useMemo(() => ({
    total: allTools.length,
    analyzing: allTools.filter(t => t.status === 'analyzing').length,
    configuring: allTools.filter(t => t.status === 'configuring').length,
    training: allTools.filter(t => t.status === 'training').length,
    trained: allTools.filter(t => t.status === 'trained').length,
  }), [allTools]);

  // Filtered and sorted tools
  const filteredTools = useMemo(() => {
    let result = [...allTools];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.data_source_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allTools, searchQuery, statusFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: ReactNode }> = {
      analyzing: {
        label: 'Analyzing',
        color: '#3b82f6',
        bg: '#dbeafe',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
      },
      configuring: {
        label: 'Configure',
        color: '#d97706',
        bg: '#fef3c7',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
      },
      training: {
        label: 'Training',
        color: '#ea580c',
        bg: '#ffedd5',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      },
      trained: {
        label: 'Ready',
        color: '#16a34a',
        bg: '#dcfce7',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
    };
    return configs[status] || configs.analyzing;
  };

  const getActionButton = (tool: AITool) => {
    switch (tool.status) {
      case 'analyzing':
        return { label: 'Analyzing...', disabled: true, primary: false };
      case 'configuring':
        return { label: 'Configure Model', disabled: false, primary: true };
      case 'training':
        return { label: 'Training...', disabled: true, primary: false };
      case 'trained':
        return { label: 'Make Predictions', disabled: false, primary: true };
      default:
        return { label: 'View', disabled: false, primary: false };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .toolkit-page { font-family: 'Outfit', sans-serif; }

        /* Mode Toggle */
        .mode-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          background: #f3f4f6;
          border-radius: 10px;
        }
        .mode-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mode-btn:hover { color: #374151; }
        .mode-btn.active {
          background: #fff;
          color: #0d9488;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Stats Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        .stat-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .stat-card:hover { border-color: #0d9488; }
        .stat-card.active { border-color: #0d9488; background: #f0fdfa; }
        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          font-family: 'JetBrains Mono', monospace;
        }
        .stat-label { font-size: 13px; color: #6b7280; margin-top: 2px; }

        /* Toolbar */
        .toolbar {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .search-input {
          flex: 1;
          min-width: 200px;
          padding: 8px 12px 8px 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .search-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1); }
        .filter-select {
          padding: 8px 32px 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          outline: none;
          font-family: 'Outfit', sans-serif;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .view-toggle {
          display: flex;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .view-btn {
          padding: 8px 12px;
          border: none;
          background: #fff;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s;
        }
        .view-btn:hover { background: #f3f4f6; }
        .view-btn.active { background: #0d9488; color: #fff; }
        .toolbar-btn {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .toolbar-btn:hover { background: #f3f4f6; }
        .toolbar-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .toolbar-btn.primary:hover { box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3); }

        /* Table */
        .data-table {
          width: 100%;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .data-table table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table th.sortable { cursor: pointer; user-select: none; }
        .data-table th.sortable:hover { color: #0d9488; }
        .data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
          color: #111827;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #f9fafb; }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        .action-btn {
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .action-btn:hover { background: #f9fafb; }
        .action-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Grid View */
        .models-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) { .models-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .models-grid { grid-template-columns: 1fr; } }
        .grid-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .grid-card:hover { border-color: #0d9488; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
        .grid-card.highlight { border-color: #d97706; border-width: 2px; }
        .grid-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .grid-card-name { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px 0; }
        .grid-card-dataset { font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 6px; }
        .grid-card-content { margin: 16px 0; }
        .grid-card-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
        .grid-action-btn {
          flex: 1;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .grid-action-btn.secondary { background: #f9fafb; border: 1px solid #e5e7eb; color: #374151; }
        .grid-action-btn.secondary:hover { background: #f3f4f6; }
        .grid-action-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .grid-action-btn.primary:hover { box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3); }
        .grid-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Progress bar */
        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        /* Simple Mode Styles */
        .simple-header { text-align: center; margin-bottom: 40px; }
        .simple-header h1 { font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
        .simple-header p { font-size: 16px; color: #6b7280; margin: 0 0 24px 0; }
        .simple-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .simple-upload-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13, 148, 136, 0.3); }

        .simple-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 24px;
        }
        .simple-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 28px;
          transition: all 0.2s;
        }
        .simple-card:hover { border-color: #0d9488; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06); }
        .simple-card.needs-action { border-color: #d97706; border-width: 2px; background: #fffbeb; }
        .simple-card-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .simple-card-name { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
        .simple-card-dataset {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .simple-card-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .simple-info-item {}
        .simple-info-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
        .simple-info-value { font-size: 15px; font-weight: 600; color: #111827; margin-top: 2px; }
        .simple-card-actions { display: flex; gap: 12px; }
        .simple-action-btn {
          flex: 1;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .simple-action-btn.secondary { background: #f9fafb; border: 1px solid #e5e7eb; color: #374151; }
        .simple-action-btn.secondary:hover { background: #f3f4f6; }
        .simple-action-btn.primary {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
          border: none;
          color: #fff;
        }
        .simple-action-btn.primary:hover { box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3); }
        .simple-action-btn.warning {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          border: none;
          color: #fff;
        }
        .simple-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Simple Empty State */
        .simple-empty {
          text-align: center;
          padding: 80px 32px;
          background: #fff;
          border: 2px dashed #e5e7eb;
          border-radius: 20px;
          max-width: 500px;
          margin: 0 auto;
        }
        .simple-empty-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .simple-empty h3 { font-size: 22px; font-weight: 600; color: #111827; margin: 0 0 12px 0; }
        .simple-empty p { font-size: 15px; color: #6b7280; margin: 0 0 28px 0; line-height: 1.6; }

        /* Empty State */
        .empty-state { text-align: center; padding: 80px 32px; }
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #f0fdfa;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .empty-title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 8px 0; }
        .empty-desc { font-size: 15px; color: #6b7280; margin: 0 0 32px 0; }
      `}</style>

      <div className="toolkit-page">
        {/* Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${interfaceMode === 'simple' ? 'active' : ''}`}
              onClick={() => interfaceMode !== 'simple' && toggleInterfaceMode()}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Simple
            </button>
            <button
              className={`mode-btn ${interfaceMode === 'pro' ? 'active' : ''}`}
              onClick={() => interfaceMode !== 'pro' && toggleInterfaceMode()}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Pro
            </button>
          </div>
        </div>

        {interfaceMode === 'simple' ? (
          /* ==================== SIMPLE MODE ==================== */
          <>
            <div className="simple-header">
              <h1>AI Models</h1>
              <p>Train machine learning models on your datasets</p>
              {allTools.length > 0 && (
                <button className="simple-upload-btn" onClick={() => setIsAnalyzeModalOpen(true)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Analysis
                </button>
              )}
            </div>

            {allTools.length === 0 ? (
              <div className="simple-empty">
                <div className="simple-empty-icon">
                  <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3>Create your first AI model</h3>
                <p>Select a dataset and describe what you want to predict. Our AI will analyze your data and suggest the best approach.</p>
                <button className="simple-upload-btn" onClick={() => setIsAnalyzeModalOpen(true)}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Analysis
                </button>
              </div>
            ) : (
              <div className="simple-grid">
                {allTools.map((tool) => {
                  const statusConfig = getStatusConfig(tool.status);
                  const needsAction = tool.status === 'configuring';
                  const isTraining = tool.status === 'training';
                  const isAnalyzing = tool.status === 'analyzing';
                  const isTrained = tool.status === 'trained';

                  return (
                    <div key={tool.id} className={`simple-card ${needsAction ? 'needs-action' : ''}`}>
                      <div
                        className="simple-card-status"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {statusConfig.icon}
                        </svg>
                        {statusConfig.label}
                        {(isTraining || isAnalyzing) && <Spinner size="sm" />}
                      </div>

                      <h3 className="simple-card-name">{tool.name}</h3>
                      <div className="simple-card-dataset">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        {tool.data_source_name}
                      </div>

                      {isTrained && tool.active_version_data && (
                        <div className="simple-card-info">
                          <div className="simple-info-item">
                            <div className="simple-info-label">Algorithm</div>
                            <div className="simple-info-value">{tool.active_version_data.model_algorithm || 'N/A'}</div>
                          </div>
                          <div className="simple-info-item">
                            <div className="simple-info-label">Accuracy</div>
                            <div className="simple-info-value" style={{ color: '#16a34a' }}>
                              {tool.active_version_data.metrics?.r2_score
                                ? `${(tool.active_version_data.metrics.r2_score * 100).toFixed(1)}%`
                                : 'N/A'}
                            </div>
                          </div>
                          <div className="simple-info-item">
                            <div className="simple-info-label">Version</div>
                            <div className="simple-info-value">v{tool.active_version_number}</div>
                          </div>
                          <div className="simple-info-item">
                            <div className="simple-info-label">Trained</div>
                            <div className="simple-info-value">{formatDate(tool.active_version_data.trained_at || tool.updated_at)}</div>
                          </div>
                        </div>
                      )}

                      {(isTraining || isAnalyzing) && (
                        <div style={{ marginBottom: '20px' }}>
                          <div className="progress-bar">
                            <motion.div
                              className="progress-fill"
                              style={{ background: statusConfig.color }}
                              initial={{ width: '10%' }}
                              animate={{ width: isAnalyzing ? '60%' : '45%' }}
                              transition={{ duration: 2, ease: 'easeOut' }}
                            />
                          </div>
                          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                            {isAnalyzing ? 'AI is analyzing your data...' : 'Training in progress...'}
                          </p>
                        </div>
                      )}

                      <div className="simple-card-actions">
                        <button
                          className="simple-action-btn secondary"
                          onClick={() => navigate(`/analysis/${tool.id}`)}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        {needsAction ? (
                          <button
                            className="simple-action-btn warning"
                            onClick={() => navigate(`/analysis/${tool.id}`)}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                            Configure
                          </button>
                        ) : isTrained ? (
                          <button
                            className="simple-action-btn primary"
                            onClick={() => navigate(`/predictions?model=${tool.id}`)}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Predict
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ==================== PRO MODE ==================== */
          <>
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
                AI Analysis Tools
              </h1>
              <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
                Create, configure, and manage ML models
              </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div
                className={`stat-card ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <div className="stat-icon" style={{ background: '#f0fdfa' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Models</div>
                </div>
              </div>
              <div
                className={`stat-card ${statusFilter === 'analyzing' ? 'active' : ''}`}
                onClick={() => setStatusFilter('analyzing')}
              >
                <div className="stat-icon" style={{ background: '#dbeafe' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.analyzing}</div>
                  <div className="stat-label">Analyzing</div>
                </div>
              </div>
              <div
                className={`stat-card ${statusFilter === 'configuring' ? 'active' : ''}`}
                onClick={() => setStatusFilter('configuring')}
              >
                <div className="stat-icon" style={{ background: '#fef3c7' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#d97706">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.configuring}</div>
                  <div className="stat-label">Needs Config</div>
                </div>
              </div>
              <div
                className={`stat-card ${statusFilter === 'training' ? 'active' : ''}`}
                onClick={() => setStatusFilter('training')}
              >
                <div className="stat-icon" style={{ background: '#ffedd5' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#ea580c">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.training}</div>
                  <div className="stat-label">Training</div>
                </div>
              </div>
              <div
                className={`stat-card ${statusFilter === 'trained' ? 'active' : ''}`}
                onClick={() => setStatusFilter('trained')}
              >
                <div className="stat-icon" style={{ background: '#dcfce7' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#16a34a">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="stat-value">{stats.trained}</div>
                  <div className="stat-label">Ready</div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="analyzing">Analyzing</option>
                <option value="configuring">Configuring</option>
                <option value="training">Training</option>
                <option value="trained">Trained</option>
              </select>

              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button className="toolbar-btn primary" onClick={() => setIsAnalyzeModalOpen(true)}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Analysis
              </button>
            </div>

            {/* Content */}
            {filteredTools.length === 0 && allTools.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="empty-title">No AI models yet</h3>
                <p className="empty-desc">Start analyzing your datasets with AI-powered ML models</p>
                <button className="toolbar-btn primary" onClick={() => setIsAnalyzeModalOpen(true)}>
                  Create Your First Analysis
                </button>
              </div>
            ) : filteredTools.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <p style={{ margin: 0, fontSize: '15px' }}>No models match your filters</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggleSort('name')}>
                        Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Dataset</th>
                      <th className="sortable" onClick={() => toggleSort('status')}>
                        Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Version</th>
                      <th>Accuracy</th>
                      <th className="sortable" onClick={() => toggleSort('created_at')}>
                        Created {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTools.map((tool) => {
                      const statusConfig = getStatusConfig(tool.status);
                      const action = getActionButton(tool);
                      return (
                        <tr key={tool.id}>
                          <td style={{ fontWeight: 500 }}>{tool.name}</td>
                          <td style={{ color: '#6b7280' }}>{tool.data_source_name}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={{ background: statusConfig.bg, color: statusConfig.color }}
                            >
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {statusConfig.icon}
                              </svg>
                              {statusConfig.label}
                            </span>
                          </td>
                          <td>{tool.active_version_number ? `v${tool.active_version_number}` : '-'}</td>
                          <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: tool.active_version_data?.metrics?.r2_score ? '#16a34a' : '#6b7280' }}>
                            {tool.active_version_data?.metrics?.r2_score
                              ? `${(tool.active_version_data.metrics.r2_score * 100).toFixed(1)}%`
                              : '-'}
                          </td>
                          <td style={{ color: '#6b7280', fontSize: '13px' }}>{formatDate(tool.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="action-btn" onClick={() => navigate(`/analysis/${tool.id}`)}>
                                View
                              </button>
                              {action.primary && !action.disabled && (
                                <button
                                  className="action-btn primary"
                                  onClick={() => {
                                    if (tool.status === 'trained') {
                                      navigate(`/predictions?model=${tool.id}`);
                                    } else {
                                      navigate(`/analysis/${tool.id}`);
                                    }
                                  }}
                                >
                                  {action.label}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="models-grid">
                {filteredTools.map((tool) => {
                  const statusConfig = getStatusConfig(tool.status);
                  const needsAction = tool.status === 'configuring';
                  const isTrained = tool.status === 'trained';
                  const isTraining = tool.status === 'training';
                  const isAnalyzing = tool.status === 'analyzing';

                  return (
                    <div
                      key={tool.id}
                      className={`grid-card ${needsAction ? 'highlight' : ''}`}
                      onClick={() => navigate(`/analysis/${tool.id}`)}
                    >
                      <div className="grid-card-header">
                        <div>
                          <h3 className="grid-card-name">{tool.name}</h3>
                          <div className="grid-card-dataset">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
                            </svg>
                            {tool.data_source_name}
                          </div>
                        </div>
                        <span
                          className="status-badge"
                          style={{ background: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid-card-content">
                        {isTrained && tool.active_version_data && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Accuracy</div>
                              <div style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>
                                {tool.active_version_data.metrics?.r2_score
                                  ? `${(tool.active_version_data.metrics.r2_score * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Version</div>
                              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>v{tool.active_version_number}</div>
                            </div>
                          </div>
                        )}

                        {(isTraining || isAnalyzing) && (
                          <div>
                            <div className="progress-bar">
                              <motion.div
                                className="progress-fill"
                                style={{ background: statusConfig.color }}
                                initial={{ width: '10%' }}
                                animate={{ width: isAnalyzing ? '60%' : '45%' }}
                                transition={{ duration: 2 }}
                              />
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                              {isAnalyzing ? 'Analyzing data...' : 'Training model...'}
                            </p>
                          </div>
                        )}

                        {needsAction && (
                          <p style={{ fontSize: '13px', color: '#d97706' }}>
                            Analysis complete. Configure your model to start training.
                          </p>
                        )}
                      </div>

                      <div className="grid-card-actions">
                        <button
                          className="grid-action-btn secondary"
                          onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${tool.id}`); }}
                        >
                          Details
                        </button>
                        {isTrained && (
                          <button
                            className="grid-action-btn primary"
                            onClick={(e) => { e.stopPropagation(); navigate(`/predictions?model=${tool.id}`); }}
                          >
                            Predict
                          </button>
                        )}
                        {needsAction && (
                          <button
                            className="grid-action-btn primary"
                            style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/analysis/${tool.id}`); }}
                          >
                            Configure
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <AnalyzeModal
        isOpen={isAnalyzeModalOpen}
        onClose={handleCloseModal}
        onAnalyze={handleAnalyze}
        datasets={datasets}
        preSelectedDatasetId={preSelectedDatasetId}
      />
    </div>
  );
};
