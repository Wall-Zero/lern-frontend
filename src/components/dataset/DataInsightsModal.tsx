import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset, DataInsightsResponse, ProviderAnalysis, BiasAnalysis } from '../../types/dataset.types';
import { Spinner } from '../common/Spinner';

interface DataInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Dataset | null;
}

type TabType = 'claude' | 'gemini' | 'comparison';

const SeverityBadge = ({ severity }: { severity: BiasAnalysis['severity'] }) => {
  const colors = {
    low: { bg: '#dcfce7', text: '#16a34a' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    high: { bg: '#fee2e2', text: '#dc2626' },
  };
  const color = colors[severity];
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      background: color.bg,
      color: color.text,
    }}>
      {severity}
    </span>
  );
};

const ScoreBar = ({ score, label }: { score: number; label: string }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{Math.round(score * 100)}%</span>
    </div>
    <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${score * 100}%`,
        background: score >= 0.7 ? '#16a34a' : score >= 0.4 ? '#d97706' : '#dc2626',
        borderRadius: '4px',
        transition: 'width 0.5s ease',
      }} />
    </div>
  </div>
);

const ProviderCard = ({ analysis }: { analysis: ProviderAnalysis }) => {
  const [expandedBias, setExpandedBias] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary */}
      <div style={{ padding: '16px', background: '#f0fdfa', borderRadius: '12px', borderLeft: '4px solid #0d9488' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#115e59', lineHeight: 1.6 }}>{analysis.summary}</p>
      </div>

      {/* Data Quality */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Quality
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `conic-gradient(#0d9488 ${analysis.data_quality.overall_score * 360}deg, #e5e7eb 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
            }}>
              {Math.round(analysis.data_quality.overall_score * 100)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <ScoreBar score={analysis.data_quality.completeness} label="Completeness" />
            <ScoreBar score={analysis.data_quality.consistency} label="Consistency" />
            <ScoreBar score={analysis.data_quality.accuracy} label="Accuracy" />
          </div>
        </div>
        {analysis.data_quality.recommendations.length > 0 && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Recommendations</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
              {analysis.data_quality.recommendations.map((rec, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bias Analysis */}
      {analysis.bias_analysis.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#d97706">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Bias Analysis ({analysis.bias_analysis.length} found)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analysis.bias_analysis.map((bias, i) => (
              <div key={i} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedBias(expandedBias === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SeverityBadge severity={bias.severity} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{bias.type}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>in <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>{bias.affected_column}</code></span>
                  </div>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6b7280" style={{ transform: expandedBias === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedBias === i && (
                  <div style={{ padding: '16px', fontSize: '13px', color: '#374151' }}>
                    <p style={{ margin: '0 0 12px 0' }}><strong>Description:</strong> {bias.description}</p>
                    <p style={{ margin: '0 0 12px 0' }}><strong>Impact on ML:</strong> {bias.impact_on_ml}</p>
                    <p style={{ margin: 0, padding: '12px', background: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
                      <strong>How to fix:</strong> {bias.how_to_fix}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Insights */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Feature Insights
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {analysis.feature_insights.highly_predictive.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', margin: '0 0 8px 0' }}>Highly Predictive</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {analysis.feature_insights.highly_predictive.map((f, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#dcfce7', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.feature_insights.redundant.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px 0' }}>Redundant</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {analysis.feature_insights.redundant.map((f, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#fee2e2', borderRadius: '6px', fontSize: '12px', color: '#991b1b' }}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.feature_insights.needs_transformation.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', margin: '0 0 8px 0' }}>Needs Transformation</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {analysis.feature_insights.needs_transformation.map((f, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {analysis.feature_insights.feature_engineering_ideas.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 8px 0' }}>Feature Engineering Ideas</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                {analysis.feature_insights.feature_engineering_ideas.map((idea, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{idea}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ML Readiness */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          ML Readiness
          <span style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: analysis.ml_readiness.status === 'ready' ? '#dcfce7' : analysis.ml_readiness.status === 'needs_work' ? '#fef3c7' : '#fee2e2',
            color: analysis.ml_readiness.status === 'ready' ? '#16a34a' : analysis.ml_readiness.status === 'needs_work' ? '#d97706' : '#dc2626',
          }}>
            {analysis.ml_readiness.status === 'ready' ? 'Ready' : analysis.ml_readiness.status === 'needs_work' ? 'Needs Work' : 'Not Suitable'}
          </span>
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {analysis.ml_readiness.strengths.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', margin: '0 0 8px 0' }}>Strengths</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                {analysis.ml_readiness.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.ml_readiness.weaknesses.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px 0' }}>Weaknesses</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                {analysis.ml_readiness.weaknesses.map((w, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.ml_readiness.preprocessing_steps.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 8px 0' }}>Preprocessing Steps</p>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                {analysis.ml_readiness.preprocessing_steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {analysis.ml_readiness.recommended_algorithms.length > 0 && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#8b5cf6', margin: '0 0 8px 0' }}>Recommended Algorithms</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {analysis.ml_readiness.recommended_algorithms.map((algo, i) => (
                  <span key={i} style={{ padding: '4px 10px', background: '#ede9fe', borderRadius: '6px', fontSize: '12px', color: '#6d28d9' }}>{algo}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ComparisonView = ({ insights }: { insights: DataInsightsResponse }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {insights.comparison.agreements.length > 0 && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Both Models Agree
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
          {insights.comparison.agreements.map((item, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
          ))}
        </ul>
      </div>
    )}
    {insights.comparison.disagreements.length > 0 && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Models Disagree
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
          {insights.comparison.disagreements.map((item, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export const DataInsightsModal = ({ isOpen, onClose, dataset }: DataInsightsModalProps) => {
  const [insights, setInsights] = useState<DataInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('claude');

  useEffect(() => {
    if (isOpen && dataset) {
      fetchInsights();
    }
    return () => {
      setInsights(null);
      setError(null);
    };
  }, [isOpen, dataset?.id]);

  const fetchInsights = async () => {
    if (!dataset) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await datasetsApi.getInsights({ data_source_id: dataset.id });
      setInsights(data);
      // Set initial tab based on available analyses
      if (data.analyses.length > 0) {
        const firstProvider = data.analyses[0].provider.toLowerCase();
        setActiveTab(firstProvider === 'claude' || firstProvider === 'gemini' ? firstProvider : 'claude');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch insights';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const claudeAnalysis = insights?.analyses.find(a => a.provider.toLowerCase() === 'claude');
  const geminiAnalysis = insights?.analyses.find(a => a.provider.toLowerCase() === 'gemini');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#f9fafb',
            borderRadius: '16px',
            width: '900px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Outfit", sans-serif',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
                Data Insights
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                AI-powered analysis of <strong>{dataset?.name}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                border: 'none',
                background: '#f3f4f6',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          {!isLoading && insights && (
            <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
              {claudeAnalysis && (
                <button
                  onClick={() => setActiveTab('claude')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: activeTab === 'claude' ? '#0d9488' : '#f3f4f6',
                    color: activeTab === 'claude' ? '#fff' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Claude
                </button>
              )}
              {geminiAnalysis && (
                <button
                  onClick={() => setActiveTab('gemini')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: activeTab === 'gemini' ? '#0d9488' : '#f3f4f6',
                    color: activeTab === 'gemini' ? '#fff' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Gemini
                </button>
              )}
              {insights.comparison && (
                <button
                  onClick={() => setActiveTab('comparison')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: activeTab === 'comparison' ? '#0d9488' : '#f3f4f6',
                    color: activeTab === 'comparison' ? '#fff' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Comparison
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
                <Spinner size="lg" />
                <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>Analyzing your data with AI...</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>This may take 10-30 seconds</p>
              </div>
            ) : error ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 500, color: '#dc2626' }}>Failed to load insights</p>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>{error}</p>
                <button
                  onClick={fetchInsights}
                  style={{
                    padding: '10px 20px',
                    background: '#0d9488',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : insights ? (
              <>
                {activeTab === 'claude' && claudeAnalysis && <ProviderCard analysis={claudeAnalysis} />}
                {activeTab === 'gemini' && geminiAnalysis && <ProviderCard analysis={geminiAnalysis} />}
                {activeTab === 'comparison' && <ComparisonView insights={insights} />}
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
