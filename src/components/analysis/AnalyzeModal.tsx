import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dataset } from '../../types/dataset.types';

interface AnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (data: {
    data_source_id: number;
    name: string;
    intent: string;
    ai_model: string;
  }) => Promise<void>;
  datasets: Dataset[];
  preSelectedDatasetId?: number | null;
}

type Step = 1 | 2 | 3;

const AI_MODELS = [
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s multimodal AI, great for data analysis',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#4285f4',
    recommended: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s assistant, excellent reasoning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#d97706',
    recommended: false,
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    description: 'OpenAI\'s most capable model',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: 24, height: 24 }}>
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    color: '#10a37f',
    recommended: false,
  },
];

export const AnalyzeModal = ({
  isOpen,
  onClose,
  onAnalyze,
  datasets,
  preSelectedDatasetId
}: AnalyzeModalProps) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [intent, setIntent] = useState('');
  const [aiModel, setAiModel] = useState('gemini');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDataset = useMemo(() =>
    datasets.find(d => d.id === datasetId),
    [datasets, datasetId]
  );

  const filteredDatasets = useMemo(() => {
    if (!searchQuery) return datasets;
    const q = searchQuery.toLowerCase();
    return datasets.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  }, [datasets, searchQuery]);

  // Pre-select dataset when provided
  useEffect(() => {
    if (preSelectedDatasetId && datasets.length > 0) {
      const dataset = datasets.find(d => d.id === preSelectedDatasetId);
      if (dataset) {
        setDatasetId(preSelectedDatasetId);
        setCurrentStep(2);
      }
    }
  }, [preSelectedDatasetId, datasets]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (!preSelectedDatasetId) {
          setDatasetId(null);
          setCurrentStep(1);
        }
        setName('');
        setIntent('');
        setAiModel('gemini');
        setSearchQuery('');
      }, 200);
    }
  }, [isOpen, preSelectedDatasetId]);

  const handleDatasetSelect = (id: number) => {
    setDatasetId(id);
    const dataset = datasets.find(d => d.id === id);
    if (dataset && !name) {
      setName(`${dataset.name} Analysis`);
    }
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!datasetId || !name || !intent) return;

    setIsSubmitting(true);
    try {
      await onAnalyze({
        data_source_id: datasetId,
        name,
        intent,
        ai_model: aiModel,
      });
      setDatasetId(null);
      setName('');
      setIntent('');
      setAiModel('gemini');
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = datasetId !== null;
  const canProceedToStep3 = canProceedToStep2 && name.trim().length > 0;
  const canSubmit = canProceedToStep3 && intent.trim().length > 0;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

            .analyze-modal * {
              font-family: 'Outfit', sans-serif;
            }
            .analyze-input {
              width: 100%;
              padding: 14px 16px;
              background: #fff;
              border: 1.5px solid #e5e7eb;
              border-radius: 12px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              transition: all 0.2s ease;
              outline: none;
            }
            .analyze-input:focus {
              border-color: #0d9488;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .analyze-input::placeholder {
              color: #9ca3af;
            }
            .analyze-textarea {
              width: 100%;
              padding: 14px 16px;
              background: #fff;
              border: 1.5px solid #e5e7eb;
              border-radius: 12px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              color: #111827;
              transition: all 0.2s ease;
              outline: none;
              resize: vertical;
              min-height: 120px;
              line-height: 1.6;
            }
            .analyze-textarea:focus {
              border-color: #0d9488;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .dataset-card {
              padding: 16px;
              background: #fff;
              border: 1.5px solid #e5e7eb;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .dataset-card:hover {
              border-color: #0d9488;
              background: #f0fdfa;
            }
            .dataset-card.selected {
              border-color: #0d9488;
              background: #f0fdfa;
              box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
            }
            .model-card {
              padding: 14px;
              background: #fff;
              border: 1.5px solid #e5e7eb;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
              flex: 1;
              min-width: 0;
            }
            .model-card:hover {
              border-color: #d1d5db;
              background: #f9fafb;
            }
            .model-card.selected {
              border-color: #0d9488;
              background: #f0fdfa;
            }
            .step-indicator {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.2s ease;
            }
            .step-indicator.active {
              background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
              color: #fff;
            }
            .step-indicator.completed {
              background: #0d9488;
              color: #fff;
            }
            .step-indicator.pending {
              background: #f3f4f6;
              color: #9ca3af;
            }
            .step-line {
              flex: 1;
              height: 2px;
              background: #e5e7eb;
              margin: 0 8px;
              transition: all 0.2s ease;
            }
            .step-line.completed {
              background: #0d9488;
            }
            .cancel-btn {
              padding: 14px 24px;
              background: #fff;
              border: 1.5px solid #e5e7eb;
              border-radius: 12px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 500;
              color: #6b7280;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .cancel-btn:hover {
              background: #f9fafb;
              border-color: #d1d5db;
            }
            .submit-btn {
              padding: 14px 32px;
              background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
              border: none;
              border-radius: 12px;
              font-family: 'Outfit', sans-serif;
              font-size: 15px;
              font-weight: 600;
              color: #fff;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .submit-btn:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
            }
            .submit-btn:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .back-btn {
              padding: 8px 16px;
              background: transparent;
              border: none;
              border-radius: 8px;
              font-family: 'Outfit', sans-serif;
              font-size: 14px;
              font-weight: 500;
              color: #6b7280;
              cursor: pointer;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .back-btn:hover {
              background: #f3f4f6;
              color: #374151;
            }
            .datasets-scroll {
              max-height: 280px;
              overflow-y: auto;
              padding-right: 8px;
            }
            .datasets-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .datasets-scroll::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 3px;
            }
            .datasets-scroll::-webkit-scrollbar-thumb {
              background: #d1d5db;
              border-radius: 3px;
            }
            .datasets-scroll::-webkit-scrollbar-thumb:hover {
              background: #9ca3af;
            }
            .mono {
              font-family: 'JetBrains Mono', monospace;
            }
          `}</style>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Modal */}
          <motion.div
            className="analyze-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #f0fdfa 0%, #f8fafc 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>
                      Start New Analysis
                    </h2>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '2px 0 0 0' }}>
                      Train an AI model on your data
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Step Indicators */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`step-indicator ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : 'pending'}`}>
                  {currentStep > 1 ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : '1'}
                </div>
                <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`} />
                <div className={`step-indicator ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : 'pending'}`}>
                  {currentStep > 2 ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : '2'}
                </div>
                <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`} />
                <div className={`step-indicator ${currentStep === 3 ? 'active' : 'pending'}`}>3</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 4px' }}>
                <span style={{ fontSize: '12px', color: currentStep >= 1 ? '#0d9488' : '#9ca3af', fontWeight: 500 }}>Select Data</span>
                <span style={{ fontSize: '12px', color: currentStep >= 2 ? '#0d9488' : '#9ca3af', fontWeight: 500 }}>Configure</span>
                <span style={{ fontSize: '12px', color: currentStep >= 3 ? '#0d9488' : '#9ca3af', fontWeight: 500 }}>Define Goal</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 28px', maxHeight: 'calc(90vh - 280px)', overflowY: 'auto' }}>
              <AnimatePresence mode="wait">
                {/* Step 1: Select Dataset */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>
                        Choose Your Dataset
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        Select the data you want to analyze and train a model on
                      </p>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                      <svg
                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                        width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search datasets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="analyze-input"
                        style={{ paddingLeft: '44px' }}
                      />
                    </div>

                    {/* Dataset List */}
                    <div className="datasets-scroll">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredDatasets.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                            <svg style={{ margin: '0 auto 12px' }} width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p style={{ margin: 0, fontSize: '14px' }}>No datasets found</p>
                          </div>
                        ) : (
                          filteredDatasets.map((dataset) => (
                            <div
                              key={dataset.id}
                              className={`dataset-card ${datasetId === dataset.id ? 'selected' : ''}`}
                              onClick={() => handleDatasetSelect(dataset.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                <div style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: datasetId === dataset.id ? '#ccfbf1' : '#f3f4f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={datasetId === dataset.id ? '#0d9488' : '#6b7280'}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                      {dataset.name}
                                    </span>
                                    <span style={{
                                      padding: '2px 8px',
                                      background: '#f3f4f6',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#6b7280',
                                      textTransform: 'uppercase'
                                    }}>
                                      {dataset.type}
                                    </span>
                                  </div>
                                  {dataset.description && (
                                    <p style={{
                                      fontSize: '13px',
                                      color: '#6b7280',
                                      margin: '0 0 8px 0',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {dataset.description}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', gap: '16px' }}>
                                    <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      {dataset.row_count?.toLocaleString() || '—'} rows
                                    </span>
                                    <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      {dataset.columns?.length || '—'} cols
                                    </span>
                                    <span className="mono" style={{ fontSize: '12px', color: '#9ca3af' }}>
                                      {formatFileSize(dataset.file_size)}
                                    </span>
                                  </div>
                                </div>
                                {datasetId === dataset.id && (
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#0d9488',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Configure Analysis */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button className="back-btn" onClick={() => setCurrentStep(1)} style={{ marginBottom: '16px' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Change dataset
                    </button>

                    {/* Selected Dataset Summary */}
                    {selectedDataset && (
                      <div style={{
                        padding: '14px 16px',
                        background: '#f0fdfa',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ fontSize: '14px', color: '#0f766e', fontWeight: 500 }}>
                          Using: <strong>{selectedDataset.name}</strong>
                        </span>
                        <span className="mono" style={{ fontSize: '12px', color: '#0d9488', marginLeft: 'auto' }}>
                          {selectedDataset.row_count?.toLocaleString()} rows × {selectedDataset.columns?.length} cols
                        </span>
                      </div>
                    )}

                    {/* Analysis Name */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Analysis Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Sales Forecast Model"
                        className="analyze-input"
                      />
                    </div>

                    {/* AI Model Selection */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        AI Model
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {AI_MODELS.map((model) => (
                          <div
                            key={model.id}
                            className={`model-card ${aiModel === model.id ? 'selected' : ''}`}
                            onClick={() => setAiModel(model.id)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <div style={{ color: model.color }}>{model.icon}</div>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                {model.name}
                              </span>
                              {model.recommended && (
                                <span style={{
                                  padding: '2px 6px',
                                  background: '#dcfce7',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#16a34a',
                                  marginLeft: 'auto'
                                }}>
                                  REC
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
                              {model.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Button */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="submit-btn"
                        disabled={!canProceedToStep3}
                        onClick={() => setCurrentStep(3)}
                      >
                        Continue
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Define Goal */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button className="back-btn" onClick={() => setCurrentStep(2)} style={{ marginBottom: '16px' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to configuration
                    </button>

                    {/* Summary Card */}
                    <div style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Analysis Summary</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dataset</span>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '2px 0 0 0' }}>
                            {selectedDataset?.name}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analysis Name</span>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '2px 0 0 0' }}>
                            {name}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Model</span>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '2px 0 0 0' }}>
                            {AI_MODELS.find(m => m.id === aiModel)?.name}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Size</span>
                          <p className="mono" style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: '2px 0 0 0' }}>
                            {selectedDataset?.row_count?.toLocaleString()} × {selectedDataset?.columns?.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Intent Input */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        What do you want to predict?
                      </label>
                      <textarea
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="Example: Predict future oil prices based on volatility and market trends. The target column is 'close_price' and I want to use historical data to forecast the next 30 days."
                        className="analyze-textarea"
                        rows={4}
                      />
                    </div>

                    {/* Tip Card */}
                    <div style={{
                      padding: '14px 16px',
                      background: '#fef3c7',
                      borderRadius: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', margin: '0 0 4px 0' }}>
                          Pro Tips for Better Results
                        </p>
                        <ul style={{ fontSize: '13px', color: '#a16207', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                          <li>Mention the specific column you want to predict</li>
                          <li>Describe what features might be relevant</li>
                          <li>Specify the time horizon if forecasting</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>

              {currentStep === 3 && (
                <button
                  className="submit-btn"
                  disabled={!canSubmit || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Starting Analysis...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Analysis
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
