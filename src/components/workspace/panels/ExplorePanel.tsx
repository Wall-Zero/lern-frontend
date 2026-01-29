import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Button } from '../../common/Button';
import { OverviewTab, DataTableTab, AIAssistantTab, EnrichTab, CompareTab } from './explore';

type TabId = 'overview' | 'data' | 'ai' | 'enrich' | 'compare';

const TABS: { id: TabId; label: string; compareOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'data', label: 'Data' },
  { id: 'ai', label: 'AI Assistant' },
  { id: 'enrich', label: 'Enrich' },
  { id: 'compare', label: 'Compare', compareOnly: true },
];

export const ExplorePanel = () => {
  const { state, toggleMarketplace, runAnalysis, fetchDataInsights, fetchMultiDatasetInsights } = useWorkspace();
  const { activeDataset, previewData, previewColumns, metadata, dataInsights, compareDatasets, compareMetadata, comparePreviewData, multiDatasetInsights } = state;
  const hasCompareDatasets = compareDatasets.length > 0;
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [intent, setIntent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!activeDataset) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#9ca3af',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg style={{ margin: '0 auto 16px', display: 'block' }} height="48" width="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
          </svg>
          <p style={{ margin: 0, fontSize: '15px' }}>Select a dataset from the sidebar to explore</p>
        </div>
      </div>
    );
  }

  const handleGetInsights = async () => {
    if (!intent.trim()) return;
    setIsAnalyzing(true);
    try {
      await runAnalysis(intent);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    await fetchDataInsights();
  };

  return (
    <div style={{ padding: '24px', fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .explore-tab-btn {
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .explore-tab-btn:hover {
          color: #111827;
        }
        .explore-tab-btn.active {
          color: #0d9488;
          border-bottom-color: #0d9488;
          font-weight: 600;
        }

        .explore-insights-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.15s;
        }
        .explore-insights-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        .explore-insights-input::placeholder {
          color: #9ca3af;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 4px 0'
          }}>{activeDataset.name}</h1>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            {activeDataset.row_count} rows &middot; {previewColumns.length} columns &middot; {activeDataset.type.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px', flexShrink: 0 }}>
        {TABS.filter((tab) => !tab.compareOnly || hasCompareDatasets).map((tab) => (
          <button
            key={tab.id}
            className={`explore-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={tab.id === 'compare' ? { color: activeTab === 'compare' ? '#d97706' : '#6b7280', borderBottomColor: activeTab === 'compare' ? '#d97706' : 'transparent' } : undefined}
          >
            {tab.label}
            {tab.id === 'compare' && hasCompareDatasets && (
              <span style={{ marginLeft: '6px', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#d97706' }}>
                {compareDatasets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
        {activeTab === 'overview' && (
          <OverviewTab
            dataset={activeDataset}
            metadata={metadata}
            dataInsights={dataInsights}
            onRunAnalysis={handleRunAIAnalysis}
            isProcessing={state.isProcessing}
          />
        )}

        {activeTab === 'data' && previewData && previewData.length > 0 && (
          <DataTableTab
            previewData={previewData}
            previewColumns={previewColumns}
            metadata={metadata}
            totalRows={activeDataset.row_count}
          />
        )}

        {activeTab === 'data' && (!previewData || previewData.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '14px' }}>
            No preview data available.
          </div>
        )}

        {activeTab === 'ai' && (
          <AIAssistantTab
            dataInsights={dataInsights}
            onFetchInsights={fetchDataInsights}
            isProcessing={state.isProcessing}
          />
        )}

        {activeTab === 'enrich' && (
          <EnrichTab
            dataSourceId={activeDataset.id}
            onOpenMarketplace={toggleMarketplace}
          />
        )}

        {activeTab === 'compare' && (
          <CompareTab
            compareDatasets={compareDatasets}
            compareMetadata={compareMetadata}
            comparePreviewData={comparePreviewData}
            multiDatasetInsights={multiDatasetInsights}
            onFetchInsights={fetchMultiDatasetInsights}
            isProcessing={state.isProcessing}
          />
        )}
      </div>

      {/* AI Insights prompt - always at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
          border: '1px solid #99f6e4',
          borderRadius: '12px',
          padding: '24px',
          flexShrink: 0,
        }}
      >
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 8px 0'
        }}>Get AI Insights</h3>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          margin: '0 0 16px 0',
          lineHeight: 1.5
        }}>
          Describe what you want to predict or analyze, and AI will suggest the best approach.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGetInsights()}
            placeholder="e.g., I want to predict house prices based on features..."
            className="explore-insights-input"
          />
          <Button
            onClick={handleGetInsights}
            isLoading={isAnalyzing}
            disabled={!intent.trim() || isAnalyzing}
          >
            Analyze
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
