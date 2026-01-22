import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marketplaceApi } from '../../api/endpoints/marketplace';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset } from '../../types/dataset.types';
import type {
  MarketplaceCatalog,
  AISuggestion,
  FetchResponse,
  ExternalDataSource,
} from '../../types/marketplace.types';
import { Spinner } from '../../components/common/Spinner';

type ViewMode = 'catalog' | 'suggestions' | 'preview' | 'merge';

const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  market_indices: { label: 'Market Indices', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: '#3b82f6' },
  volatility: { label: 'Volatility', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#f59e0b' },
  interest_rates: { label: 'Interest Rates', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#10b981' },
  commodities: { label: 'Commodities', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: '#8b5cf6' },
  currency: { label: 'Currency', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: '#ec4899' },
  economic_indicators: { label: 'Economic', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#6366f1' },
};

export const Marketplace = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [catalog, setCatalog] = useState<MarketplaceCatalog | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsIntent, setSuggestionsIntent] = useState('');

  // Preview state
  const [previewData, setPreviewData] = useState<FetchResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewSeriesId, setPreviewSeriesId] = useState<string | null>(null);

  // Merge state
  const [selectedSeries, setSelectedSeries] = useState<ExternalDataSource[]>([]);
  const [mergeColumn] = useState('date');
  const [mergeStrategy, setMergeStrategy] = useState<'left' | 'right' | 'inner' | 'outer'>('left');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<any>(null);

  useEffect(() => {
    loadDatasets();
    loadCatalog();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await datasetsApi.list();
      setDatasets(response.results.filter(d => d.status === 'connected'));
    } catch (error) {
      console.error('Failed to load datasets:', error);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const data = await marketplaceApi.getCatalog();
      setCatalog(data);
    } catch (error) {
      console.error('Failed to load catalog:', error);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!selectedDataset) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const response = await marketplaceApi.getSuggestions({
        data_source_id: selectedDataset.id,
        intent: suggestionsIntent || undefined,
      });
      setSuggestions(response.suggestions || []);
      setViewMode('suggestions');
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handlePreviewSeries = async (seriesId: string) => {
    setIsLoadingPreview(true);
    setPreviewSeriesId(seriesId);
    setPreviewData(null);
    try {
      const data = await marketplaceApi.fetchExternalData({
        source: 'fred',
        series_id: seriesId,
      });
      setPreviewData(data);
      setViewMode('preview');
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAddToMerge = (seriesId: string, seriesName: string) => {
    if (selectedSeries.find(s => s.series_id === seriesId)) return;
    setSelectedSeries([...selectedSeries, {
      source: 'fred',
      series_id: seriesId,
      column_name: seriesName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30),
    }]);
  };

  const handleRemoveFromMerge = (seriesId: string) => {
    setSelectedSeries(selectedSeries.filter(s => s.series_id !== seriesId));
  };

  const handleMerge = async () => {
    if (!selectedDataset || selectedSeries.length === 0) return;
    setIsMerging(true);
    setMergeResult(null);
    try {
      const result = await marketplaceApi.mergeData({
        data_source_id: selectedDataset.id,
        merge_column: mergeColumn,
        merge_strategy: mergeStrategy,
        external_data: selectedSeries,
      });
      setMergeResult(result);
      setViewMode('merge');
    } catch (error) {
      console.error('Failed to merge:', error);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div style={{ padding: '32px 40px', fontFamily: '"Outfit", sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        .mp-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        .mp-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .mp-btn {
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .mp-btn-primary {
          background: linear-gradient(135deg, #0d9488, #0f766e);
          color: #fff;
          border: none;
        }
        .mp-btn-primary:hover {
          background: linear-gradient(135deg, #0f766e, #115e59);
        }
        .mp-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .mp-btn-secondary {
          background: #fff;
          color: #374151;
          border: 1px solid #e5e7eb;
        }
        .mp-btn-secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .mp-select {
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          min-width: 200px;
        }
        .mp-select:focus {
          outline: none;
          border-color: #0d9488;
        }
        .mp-input {
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          width: 100%;
        }
        .mp-input:focus {
          outline: none;
          border-color: #0d9488;
        }
        .category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f9fafb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .category-header:hover {
          background: #f3f4f6;
        }
        .series-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .series-item:last-child {
          border-bottom: none;
        }
        .series-item:hover {
          background: #f9fafb;
        }
        .suggestion-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .relevance-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        .relevance-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d9488, #10b981);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .selected-badge {
          padding: 4px 10px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
          Data Marketplace
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#6b7280' }}>
          Enrich your datasets with external data sources from FRED
        </p>
      </div>

      {/* Dataset Selector */}
      <div className="mp-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
              Select Dataset to Enrich
            </label>
            {isLoadingDatasets ? (
              <Spinner size="sm" />
            ) : (
              <select
                className="mp-select"
                value={selectedDataset?.id || ''}
                onChange={(e) => {
                  const ds = datasets.find(d => d.id === parseInt(e.target.value));
                  setSelectedDataset(ds || null);
                }}
                style={{ width: '100%' }}
              >
                <option value="">Choose a dataset...</option>
                {datasets.map(ds => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            )}
          </div>

          {selectedDataset && (
            <>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#6b7280', marginBottom: '6px' }}>
                  What do you want to predict? (optional)
                </label>
                <input
                  type="text"
                  className="mp-input"
                  placeholder="e.g., stock prices, volatility..."
                  value={suggestionsIntent}
                  onChange={(e) => setSuggestionsIntent(e.target.value)}
                />
              </div>
              <div style={{ paddingTop: '22px' }}>
                <button
                  className="mp-btn mp-btn-primary"
                  onClick={handleGetSuggestions}
                  disabled={isLoadingSuggestions}
                >
                  {isLoadingSuggestions ? <Spinner size="sm" /> : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  )}
                  Get AI Suggestions
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected Series for Merge */}
      {selectedSeries.length > 0 && (
        <div className="mp-card" style={{ marginBottom: '24px', background: '#f0fdfa', borderColor: '#99f6e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f766e' }}>
              Selected for Merge ({selectedSeries.length})
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                className="mp-select"
                value={mergeStrategy}
                onChange={(e) => setMergeStrategy(e.target.value as any)}
                style={{ minWidth: '120px' }}
              >
                <option value="left">Left Join</option>
                <option value="inner">Inner Join</option>
                <option value="outer">Outer Join</option>
              </select>
              <button
                className="mp-btn mp-btn-primary"
                onClick={handleMerge}
                disabled={!selectedDataset || isMerging}
              >
                {isMerging ? <Spinner size="sm" /> : 'Merge Data'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedSeries.map(s => (
              <span key={s.series_id} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#fff',
                border: '1px solid #99f6e4',
                borderRadius: '6px',
                fontSize: '13px',
              }}>
                {s.series_id}
                <button
                  onClick={() => handleRemoveFromMerge(s.series_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#dc2626' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'preview' || viewMode === 'merge' ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Catalog / Suggestions */}
        <div>
          {/* View Mode Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              className={`mp-btn ${viewMode === 'catalog' ? 'mp-btn-primary' : 'mp-btn-secondary'}`}
              onClick={() => setViewMode('catalog')}
            >
              Browse Catalog
            </button>
            {suggestions.length > 0 && (
              <button
                className={`mp-btn ${viewMode === 'suggestions' ? 'mp-btn-primary' : 'mp-btn-secondary'}`}
                onClick={() => setViewMode('suggestions')}
              >
                AI Suggestions ({suggestions.length})
              </button>
            )}
          </div>

          {/* Catalog View */}
          {viewMode === 'catalog' && (
            <div>
              {isLoadingCatalog ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Spinner size="lg" />
                  <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading catalog...</p>
                </div>
              ) : catalog ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(catalog).map(([category, series]) => {
                    const meta = categoryLabels[category] || { label: category, icon: '', color: '#6b7280' };
                    const seriesObj = series as Record<string, { id: string; name: string; frequency: string }>;
                    const seriesArray = Object.entries(seriesObj);
                    const isExpanded = expandedCategory === category;

                    return (
                      <div key={category} className="mp-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div
                          className="category-header"
                          onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: `${meta.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={meta.color}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                              </svg>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>{meta.label}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{seriesArray.length} series</p>
                            </div>
                          </div>
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#9ca3af"
                            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {seriesArray.map(([id, info]) => (
                                <div key={id} className="series-item">
                                  <div>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#111827' }}>{info.name}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                      {id} • {info.frequency}
                                    </p>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {selectedSeries.find(s => s.series_id === id) ? (
                                      <span className="selected-badge">Selected</span>
                                    ) : (
                                      <>
                                        <button
                                          className="mp-btn mp-btn-secondary"
                                          style={{ padding: '6px 12px', fontSize: '13px' }}
                                          onClick={() => handlePreviewSeries(id)}
                                        >
                                          Preview
                                        </button>
                                        <button
                                          className="mp-btn mp-btn-primary"
                                          style={{ padding: '6px 12px', fontSize: '13px' }}
                                          onClick={() => handleAddToMerge(id, info.name)}
                                        >
                                          Add
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
                  Failed to load catalog. Please try again.
                </p>
              )}
            </div>
          )}

          {/* Suggestions View */}
          {viewMode === 'suggestions' && (
            <div>
              {suggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#6b7280' }}>No suggestions yet. Select a dataset and click "Get AI Suggestions".</p>
                </div>
              ) : (
                suggestions.map((suggestion, i) => (
                  <div key={i} className="suggestion-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                          {suggestion.series_name || suggestion.series_id}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{suggestion.series_id}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Relevance</p>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0d9488' }}>
                          {Math.round(suggestion.relevance_score * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="relevance-bar" style={{ marginBottom: '16px' }}>
                      <div className="relevance-fill" style={{ width: `${suggestion.relevance_score * 100}%` }} />
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Why:</strong> {suggestion.reasoning}
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>How to merge:</strong> {suggestion.how_to_merge}
                    </p>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                      <strong>Expected benefit:</strong> {suggestion.expected_benefit}
                    </p>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedSeries.find(s => s.series_id === suggestion.series_id) ? (
                        <span className="selected-badge">Selected for merge</span>
                      ) : (
                        <>
                          <button
                            className="mp-btn mp-btn-secondary"
                            onClick={() => handlePreviewSeries(suggestion.series_id)}
                          >
                            Preview Data
                          </button>
                          <button
                            className="mp-btn mp-btn-primary"
                            onClick={() => handleAddToMerge(suggestion.series_id, suggestion.series_name || suggestion.series_id)}
                          >
                            Add to Merge
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Preview / Merge Result Panel */}
        {(viewMode === 'preview' || viewMode === 'merge') && (
          <div className="mp-card" style={{ position: 'sticky', top: '20px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
            {viewMode === 'preview' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                    Data Preview
                  </h3>
                  <button
                    onClick={() => setViewMode('catalog')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isLoadingPreview ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <Spinner size="lg" />
                    <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading preview...</p>
                  </div>
                ) : previewData ? (
                  <>
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                        {previewData.series_info.title}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <span style={{ color: '#6b7280' }}>Series ID:</span>{' '}
                          <span style={{ color: '#111827', fontWeight: 500 }}>{previewData.series_info.id}</span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Frequency:</span>{' '}
                          <span style={{ color: '#111827', fontWeight: 500 }}>{previewData.series_info.frequency}</span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Units:</span>{' '}
                          <span style={{ color: '#111827', fontWeight: 500 }}>{previewData.series_info.units}</span>
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Rows:</span>{' '}
                          <span style={{ color: '#111827', fontWeight: 500 }}>{previewData.row_count.toLocaleString()}</span>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#6b7280' }}>Date Range:</span>{' '}
                          <span style={{ color: '#111827', fontWeight: 500 }}>
                            {previewData.date_range.start} to {previewData.date_range.end}
                          </span>
                        </div>
                      </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Date</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.preview.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px', color: '#6b7280' }}>{row.date}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#111827', fontFamily: 'monospace' }}>
                              {typeof row.value === 'number' ? row.value.toFixed(2) : row.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                      {previewSeriesId && !selectedSeries.find(s => s.series_id === previewSeriesId) && (
                        <button
                          className="mp-btn mp-btn-primary"
                          onClick={() => handleAddToMerge(previewSeriesId, previewData.series_info.title)}
                          style={{ flex: 1 }}
                        >
                          Add to Merge
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center' }}>No preview data</p>
                )}
              </>
            )}

            {viewMode === 'merge' && mergeResult && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#16a34a' }}>
                    Merge Complete!
                  </h3>
                  <button
                    onClick={() => { setViewMode('catalog'); setMergeResult(null); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  >
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#6b7280' }}>Original rows:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 600 }}>{mergeResult.original_rows?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Merged rows:</span>{' '}
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>{mergeResult.merged_rows?.toLocaleString()}</span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#6b7280' }}>New columns:</span>{' '}
                      <span style={{ color: '#111827', fontWeight: 500 }}>{mergeResult.new_columns?.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {mergeResult.preview && mergeResult.preview.length > 0 && (
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          {Object.keys(mergeResult.preview[0]).slice(0, 6).map(col => (
                            <th key={col} style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mergeResult.preview.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            {Object.keys(row).slice(0, 6).map(col => (
                              <td key={col} style={{ padding: '8px', color: '#374151', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {typeof row[col] === 'number' ? row[col].toFixed(2) : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
