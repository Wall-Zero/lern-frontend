import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Button } from '../../common/Button';
import { OverviewTab, DataTableTab, AIAssistantTab, EnrichTab, CompareTab } from './explore';
import { DocumentAnalysisTab } from './explore/DocumentAnalysisTab';
import { MotionDrafterTab } from './explore/MotionDrafterTab';

type TabId = 'overview' | 'data' | 'ai' | 'enrich' | 'compare' | 'document' | 'motion';

const DATA_TABS: { id: TabId; label: string; compareOnly?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'data', label: 'Data' },
  { id: 'ai', label: 'AI Assistant' },
  { id: 'enrich', label: 'Enrich' },
  { id: 'compare', label: 'Compare', compareOnly: true },
];

const DOCUMENT_TABS: { id: TabId; label: string; compareOnly?: boolean }[] = [
  { id: 'document', label: 'Analysis' },
  { id: 'motion', label: 'Draft Motion' },
  { id: 'compare', label: 'Compare', compareOnly: true },
];

const DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'txt', 'md', 'text'];

// Keywords that indicate motion drafting intent
const MOTION_KEYWORDS = ['motion', 'draft', 'write', 'compose', 'prepare', 'create'];
const ANALYSIS_KEYWORDS = ['analyze', 'review', 'examine', 'check', 'identify', 'find'];

export const ExplorePanel = () => {
  const { state, toggleMarketplace, runAnalysis, fetchDataInsights, fetchMultiDatasetInsights, pendingTool, clearPendingTool } = useWorkspace();
  const { activeDataset, previewData, previewColumns, metadata, dataInsights, compareDatasets, compareMetadata, comparePreviewData, multiDatasetInsights, userIntent, datasets } = state;
  const hasCompareDatasets = compareDatasets.length > 0;
  const isDocument = activeDataset ? DOCUMENT_TYPES.includes(activeDataset.type?.toLowerCase()) : false;

  // Get all available documents for reference in motion drafting (show all uploaded files)
  const availableDocuments = datasets
    .map(ds => ({ id: ds.id, name: ds.name, type: ds.type || 'file' }));
  const TABS = isDocument ? DOCUMENT_TABS : DATA_TABS;
  const [activeTab, setActiveTab] = useState<TabId>(isDocument ? 'document' : 'overview');
  const [intent, setIntent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Set the active tab based on user intent when entering explore mode
  useEffect(() => {
    if (!userIntent || !isDocument) return;

    const intentLower = userIntent.toLowerCase();

    // Check if intent suggests motion drafting
    const isMotionIntent = MOTION_KEYWORDS.some(keyword => intentLower.includes(keyword));
    // Check if intent suggests analysis
    const isAnalysisIntent = ANALYSIS_KEYWORDS.some(keyword => intentLower.includes(keyword));

    if (isMotionIntent && !isAnalysisIntent) {
      setActiveTab('motion');
    } else if (isAnalysisIntent) {
      setActiveTab('document');
    }
  }, [userIntent, isDocument, activeDataset?.id]);

  // Auto-select tab from URL params (e.g., ?tool=motion)
  useEffect(() => {
    if (!pendingTool) return;
    const toolToTab: Record<string, TabId> = {
      motion: 'motion',
      analysis: 'document',
      compare: 'compare',
    };
    const tab = toolToTab[pendingTool];
    if (tab) {
      setActiveTab(tab);
    }
    clearPendingTool();
  }, [pendingTool, clearPendingTool]);

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

  const handleRunAIAnalysis = async (providers?: string[]) => {
    await fetchDataInsights(undefined, providers);
  };

  return (
    <div className="explore-panel">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .explore-panel {
          padding: 16px;
          font-family: 'Outfit', sans-serif;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        @media (min-width: 768px) {
          .explore-panel {
            padding: 24px;
          }
        }

        .explore-tab-bar {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 16px;
          flex-shrink: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .explore-tab-bar::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 768px) {
          .explore-tab-bar {
            margin-bottom: 20px;
          }
        }

        .explore-tab-btn {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .explore-tab-btn {
            padding: 8px 20px;
            font-size: 14px;
          }
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
          min-width: 0;
        }
        .explore-insights-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        .explore-insights-input::placeholder {
          color: #9ca3af;
        }

        .explore-insights-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        @media (min-width: 640px) {
          .explore-insights-form {
            flex-direction: row;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 4px 0',
          wordBreak: 'break-word',
        }}>{activeDataset.name}</h1>
        <p style={{
          fontSize: '12px',
          color: '#6b7280',
          margin: 0,
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          {isDocument ? (
            <>{activeDataset.type.toUpperCase()} Document</>
          ) : (
            <>{activeDataset.row_count} rows · {previewColumns.length} columns · {activeDataset.type.toUpperCase()}</>
          )}
        </p>
      </div>

      {/* Tab bar */}
      <div className="explore-tab-bar">
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
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        {activeTab === 'document' && isDocument && (
          <DocumentAnalysisTab
            analysis={dataInsights?.analyses as any}
            documentName={activeDataset.name}
            documentType={activeDataset.type}
            documentUrl={activeDataset.file}
            onRunAnalysis={handleRunAIAnalysis}
            isProcessing={state.isProcessing}
          />
        )}

        {activeTab === 'motion' && isDocument && (
          <MotionDrafterTab
            dataSourceId={activeDataset.id}
            initialIntent={userIntent}
            availableDocuments={availableDocuments}
          />
        )}

        {activeTab === 'overview' && !isDocument && (
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

      {/* AI Insights prompt - only for data files */}
      {!isDocument && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            border: '1px solid #99f6e4',
            borderRadius: '12px',
            padding: '16px',
            flexShrink: 0,
          }}
        >
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 6px 0'
          }}>Get AI Insights</h3>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '0 0 12px 0',
            lineHeight: 1.5
          }}>
            Describe what you want to predict or analyze.
          </p>
          <div className="explore-insights-form">
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetInsights()}
              placeholder="e.g., predict house prices..."
              className="explore-insights-input"
            />
            <Button
              onClick={handleGetInsights}
              isLoading={isAnalyzing}
              disabled={!intent.trim() || isAnalyzing}
              style={{ flexShrink: 0 }}
            >
              Analyze
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
