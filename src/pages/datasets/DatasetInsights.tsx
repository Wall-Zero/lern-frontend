import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { datasetsApi } from '../../api/endpoints/datasets';
import type { Dataset, DataInsightsResponse, ProviderAnalysisResult } from '../../types/dataset.types';
import { Spinner } from '../../components/common/Spinner';

type TabType = 'claude' | 'gemini' | 'comparison';

const SeverityBadge = ({ severity }: { severity: 'low' | 'medium' | 'high' }) => {
  const colors = {
    low: { bg: '#dcfce7', text: '#16a34a' },
    medium: { bg: '#fef3c7', text: '#d97706' },
    high: { bg: '#fee2e2', text: '#dc2626' },
  };
  const color = colors[severity] || colors.medium;
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

const ProviderCard = ({ analysis }: { analysis: ProviderAnalysisResult }) => {
  const [expandedBias, setExpandedBias] = useState<number | null>(null);

  const biases = analysis.bias_analysis?.detected_biases || [];
  const readinessStatus = analysis.ml_readiness?.overall_readiness || 'needs_work';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary */}
      <div style={{ padding: '20px', background: '#f0fdfa', borderRadius: '12px', borderLeft: '4px solid #0d9488' }}>
        <p style={{ margin: 0, fontSize: '15px', color: '#115e59', lineHeight: 1.7 }}>{analysis.summary}</p>
      </div>

      {/* Data Quality */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0d9488">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Quality
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `conic-gradient(#0d9488 ${analysis.data_quality.overall_score * 360}deg, #e5e7eb 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
            }}>
              {Math.round(analysis.data_quality.overall_score * 100)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <ScoreBar score={analysis.data_quality.completeness?.score || 0} label="Completeness" />
            <ScoreBar score={analysis.data_quality.consistency?.score || 0} label="Consistency" />
            <ScoreBar score={analysis.data_quality.accuracy?.score || 0} label="Accuracy" />
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {analysis.data_quality.completeness?.recommendation && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#0d9488', textTransform: 'uppercase' }}>Completeness</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{analysis.data_quality.completeness.recommendation}</p>
            </div>
          )}
          {analysis.data_quality.consistency?.recommendation && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#0d9488', textTransform: 'uppercase' }}>Consistency</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{analysis.data_quality.consistency.recommendation}</p>
            </div>
          )}
          {analysis.data_quality.accuracy?.recommendation && (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 600, color: '#0d9488', textTransform: 'uppercase' }}>Accuracy</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{analysis.data_quality.accuracy.recommendation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bias Analysis */}
      {biases.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Bias Analysis
            <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 400, color: '#6b7280' }}>{biases.length} found</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {biases.map((bias, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedBias(expandedBias === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    background: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <SeverityBadge severity={bias.severity} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{bias.type}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      in <code style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{bias.column}</code>
                    </span>
                  </div>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#6b7280" style={{ transform: expandedBias === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedBias === i && (
                  <div style={{ padding: '18px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                    <p style={{ margin: '0 0 14px 0' }}><strong>Description:</strong> {bias.description}</p>
                    <p style={{ margin: '0 0 14px 0' }}><strong>Impact:</strong> {bias.impact}</p>
                    <p style={{ margin: 0, padding: '14px', background: '#f0fdf4', borderRadius: '8px', color: '#166534' }}>
                      <strong>Mitigation:</strong> {bias.mitigation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {analysis.bias_analysis?.recommendations && analysis.bias_analysis.recommendations.length > 0 && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Recommendations</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#78350f', lineHeight: 1.6 }}>
                {analysis.bias_analysis.recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Feature Insights */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#3b82f6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Feature Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {analysis.feature_insights?.highly_predictive?.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Highly Predictive</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.feature_insights.highly_predictive.slice(0, 12).map((f, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: '#dcfce7', borderRadius: '6px', fontSize: '13px', color: '#166534' }}>{f}</span>
                ))}
                {analysis.feature_insights.highly_predictive.length > 12 && (
                  <span style={{ padding: '5px 12px', background: '#e5e7eb', borderRadius: '6px', fontSize: '13px', color: '#6b7280' }}>+{analysis.feature_insights.highly_predictive.length - 12} more</span>
                )}
              </div>
            </div>
          )}
          {analysis.feature_insights?.potentially_redundant?.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Potentially Redundant</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysis.feature_insights.potentially_redundant.slice(0, 10).map((f, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: '#fee2e2', borderRadius: '6px', fontSize: '13px', color: '#991b1b' }}>{f}</span>
                ))}
                {analysis.feature_insights.potentially_redundant.length > 10 && (
                  <span style={{ padding: '5px 12px', background: '#e5e7eb', borderRadius: '6px', fontSize: '13px', color: '#6b7280' }}>+{analysis.feature_insights.potentially_redundant.length - 10} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        {analysis.feature_insights?.needs_transformation?.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#d97706', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Needs Transformation</p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {analysis.feature_insights.needs_transformation.slice(0, 6).map((t, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px' }}>
                  <strong style={{ color: '#92400e' }}>{t.column}:</strong>{' '}
                  <span style={{ color: '#78350f' }}>{t.suggested_transform}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.feature_insights?.feature_engineering_ideas?.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Feature Engineering Ideas</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
              {analysis.feature_insights.feature_engineering_ideas.map((idea, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{idea}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ML Readiness */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          ML Readiness
          <span style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            background: readinessStatus === 'ready' ? '#dcfce7' : readinessStatus === 'needs_work' ? '#fef3c7' : '#fee2e2',
            color: readinessStatus === 'ready' ? '#16a34a' : readinessStatus === 'needs_work' ? '#d97706' : '#dc2626',
          }}>
            {readinessStatus === 'ready' ? 'Ready' : readinessStatus === 'needs_work' ? 'Needs Work' : 'Not Suitable'}
          </span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {analysis.ml_readiness?.strengths?.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Strengths</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                {analysis.ml_readiness.strengths.map((s, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.ml_readiness?.weaknesses?.length > 0 && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Weaknesses</p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
                {analysis.ml_readiness.weaknesses.map((w, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {analysis.ml_readiness?.recommended_preprocessing?.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Preprocessing Steps</p>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
              {analysis.ml_readiness.recommended_preprocessing.slice(0, 8).map((step, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
              ))}
              {analysis.ml_readiness.recommended_preprocessing.length > 8 && (
                <li style={{ color: '#6b7280' }}>+{analysis.ml_readiness.recommended_preprocessing.length - 8} more steps...</li>
              )}
            </ol>
          </div>
        )}

        {analysis.ml_readiness?.suitable_algorithms?.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', margin: '0 0 10px 0', textTransform: 'uppercase' }}>Suitable Algorithms</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {analysis.ml_readiness.suitable_algorithms.map((algo, i) => (
                <span key={i} style={{ padding: '5px 12px', background: '#ede9fe', borderRadius: '6px', fontSize: '13px', color: '#6d28d9' }}>{algo}</span>
              ))}
            </div>
          </div>
        )}

        {analysis.ml_readiness?.expected_challenges?.length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Expected Challenges</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#7f1d1d', lineHeight: 1.6 }}>
              {analysis.ml_readiness.expected_challenges.map((c, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ComparisonView = ({ insights }: { insights: DataInsightsResponse }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {insights.comparison?.agreement?.length > 0 && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Both Models Agree
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>
          {insights.comparison.agreement.map((item, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
          ))}
        </ul>
      </div>
    )}
    {insights.comparison?.disagreement?.length > 0 && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Models Disagree
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>
          {insights.comparison.disagreement.map((item, i) => (
            <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
          ))}
        </ul>
      </div>
    )}
    {insights.comparison?.unique_insights && (
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Unique Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {insights.comparison.unique_insights.claude?.biases_detected && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 10px 0' }}>Claude detected</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {insights.comparison.unique_insights.claude.biases_detected.map((b, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: '#dbeafe', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>{b}</span>
                ))}
              </div>
            </div>
          )}
          {insights.comparison.unique_insights.gemini?.biases_detected && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 10px 0' }}>Gemini detected</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {insights.comparison.unique_insights.gemini.biases_detected.map((b, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: '#fce7f3', borderRadius: '6px', fontSize: '13px', color: '#9d174d' }}>{b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

export const DatasetInsights = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [insights, setInsights] = useState<DataInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('claude');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [datasetData, insightsData] = await Promise.all([
        datasetsApi.get(parseInt(id)),
        datasetsApi.getInsights({ data_source_id: parseInt(id) })
      ]);
      setDataset(datasetData);
      setInsights(insightsData);
      if (insightsData.analyses?.claude) {
        setActiveTab('claude');
      } else if (insightsData.analyses?.gemini) {
        setActiveTab('gemini');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to fetch insights';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const claudeAnalysis = insights?.analyses?.claude;
  const geminiAnalysis = insights?.analyses?.gemini;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Outfit", sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/datasets')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            color: '#6b7280',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Datasets
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#fff">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>
              Data Insights
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#6b7280' }}>
              AI-powered analysis of <strong>{dataset?.name || 'Loading...'}</strong>
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 20px', gap: '20px' }}>
          <Spinner size="lg" />
          <p style={{ margin: 0, fontSize: '16px', color: '#6b7280' }}>Analyzing your data with AI...</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>This may take 10-30 seconds</p>
        </div>
      ) : error ? (
        <div style={{ padding: '80px 40px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 600, color: '#dc2626' }}>Failed to load insights</p>
          <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280' }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              padding: '12px 24px',
              background: '#0d9488',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      ) : insights ? (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
            {claudeAnalysis && (
              <button
                onClick={() => setActiveTab('claude')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'claude' ? '#0d9488' : 'transparent',
                  color: activeTab === 'claude' ? '#fff' : '#6b7280',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Claude
              </button>
            )}
            {geminiAnalysis && (
              <button
                onClick={() => setActiveTab('gemini')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'gemini' ? '#0d9488' : 'transparent',
                  color: activeTab === 'gemini' ? '#fff' : '#6b7280',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Gemini
              </button>
            )}
            {insights.comparison && (
              <button
                onClick={() => setActiveTab('comparison')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: activeTab === 'comparison' ? '#0d9488' : 'transparent',
                  color: activeTab === 'comparison' ? '#fff' : '#6b7280',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Comparison
              </button>
            )}
          </div>

          {/* Content */}
          {activeTab === 'claude' && claudeAnalysis && <ProviderCard analysis={claudeAnalysis} />}
          {activeTab === 'gemini' && geminiAnalysis && <ProviderCard analysis={geminiAnalysis} />}
          {activeTab === 'comparison' && <ComparisonView insights={insights} />}
        </>
      ) : null}
    </div>
  );
};
