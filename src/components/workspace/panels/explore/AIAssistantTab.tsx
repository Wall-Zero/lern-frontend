import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DataInsightsResponse, ProviderAnalysisResult } from '../../../../types/dataset.types';

interface AIAssistantTabProps {
  dataInsights: DataInsightsResponse | null;
  onFetchInsights: (intent?: string, providers?: string[]) => Promise<void>;
  isProcessing: boolean;
}

const ScoreBar = ({ score, max = 10, label }: { score: number; max?: number; label: string }) => (
  <div style={{ marginBottom: '10px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
        {score}/{max}
      </span>
    </div>
    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
      <div
        style={{
          width: `${(score / max) * 100}%`,
          height: '100%',
          borderRadius: '4px',
          background: score / max >= 0.7 ? '#10b981' : score / max >= 0.4 ? '#f59e0b' : '#ef4444',
          transition: 'width 0.3s',
        }}
      />
    </div>
  </div>
);

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    low: { bg: '#dcfce7', text: '#15803d' },
    medium: { bg: '#fef9c3', text: '#a16207' },
    high: { bg: '#fee2e2', text: '#dc2626' },
  };
  const c = colors[severity] || colors.low;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {severity}
    </span>
  );
};

const ReadinessBadge = ({ readiness }: { readiness: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    ready: { bg: '#dcfce7', text: '#15803d' },
    needs_work: { bg: '#fef9c3', text: '#a16207' },
    not_suitable: { bg: '#fee2e2', text: '#dc2626' },
  };
  const c = colors[readiness] || colors.needs_work;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        background: c.bg,
        color: c.text,
      }}
    >
      {readiness.replace('_', ' ')}
    </span>
  );
};

const CardSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>{title}</h3>
    {children}
  </div>
);

const ProviderResults = ({ result, providerName }: { result: ProviderAnalysisResult; providerName: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* Data Quality */}
    <CardSection title={`Data Quality — ${providerName}`}>
      <ScoreBar score={result.data_quality.overall_score} label="Overall" />
      <ScoreBar score={result.data_quality.completeness.score} label="Completeness" />
      <ScoreBar score={result.data_quality.consistency.score} label="Consistency" />
      <ScoreBar score={result.data_quality.accuracy.score} label="Accuracy" />
      {result.data_quality.completeness.recommendation && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
          {result.data_quality.completeness.recommendation}
        </div>
      )}
    </CardSection>

    {/* Bias Analysis */}
    {result.bias_analysis && (
      <CardSection title="Bias Analysis">
        {result.bias_analysis.detected_biases.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.bias_analysis.detected_biases.map((bias, i) => (
              <div key={i} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{bias.type}</span>
                  <SeverityBadge severity={bias.severity} />
                  <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                    {bias.column}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{bias.description}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
                  <strong>Mitigation:</strong> {bias.mitigation}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No significant biases detected.</p>
        )}
        {result.bias_analysis.fairness_concerns.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Fairness Concerns</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
              {result.bias_analysis.fairness_concerns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
      </CardSection>
    )}

    {/* Feature Insights */}
    {result.feature_insights && (
      <CardSection title="Feature Insights">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Highly Predictive</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.feature_insights.highly_predictive.map((col) => (
                <span key={col} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', background: '#dcfce7', color: '#15803d', fontFamily: "'JetBrains Mono', monospace" }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Potentially Redundant</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.feature_insights.potentially_redundant.map((col) => (
                <span key={col} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', background: '#fef3c7', color: '#d97706', fontFamily: "'JetBrains Mono', monospace" }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
        {result.feature_insights.needs_transformation.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Needs Transformation</h4>
            {result.feature_insights.needs_transformation.map((t, i) => (
              <div key={i} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#111827' }}>{t.column}</span>
                <span style={{ color: '#6b7280' }}> — {t.issue}. </span>
                <span style={{ color: '#0d9488' }}>{t.suggested_transform}</span>
              </div>
            ))}
          </div>
        )}
        {result.feature_insights.feature_engineering_ideas.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Engineering Ideas</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
              {result.feature_insights.feature_engineering_ideas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </div>
        )}
      </CardSection>
    )}

    {/* ML Readiness */}
    {result.ml_readiness && (
      <CardSection title="ML Readiness">
        <div style={{ marginBottom: '16px' }}>
          <ReadinessBadge readiness={result.ml_readiness.overall_readiness} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>Strengths</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
              {result.ml_readiness.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Weaknesses</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
              {result.ml_readiness.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
        {result.ml_readiness.recommended_preprocessing.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Preprocessing Steps</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
              {result.ml_readiness.recommended_preprocessing.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
        {result.ml_readiness.suitable_algorithms.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Suitable Algorithms</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {result.ml_readiness.suitable_algorithms.map((alg) => (
                <span key={alg} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', background: '#ede9fe', color: '#7c3aed', fontFamily: "'JetBrains Mono', monospace" }}>
                  {alg}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardSection>
    )}
  </div>
);

export const AIAssistantTab = ({ dataInsights, onFetchInsights, isProcessing }: AIAssistantTabProps) => {
  const [providers, setProviders] = useState<{ claude: boolean; gemini: boolean }>({ claude: true, gemini: true });
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const selected = Object.entries(providers)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await onFetchInsights(intent || undefined, selected);
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isProcessing;
  const claude = dataInsights?.analyses?.claude;
  const gemini = dataInsights?.analyses?.gemini;
  const comparison = dataInsights?.comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <style>{`
        .ai-assistant-checkbox { cursor: pointer; accent-color: #0d9488; }
        .ai-assistant-input {
          flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; font-family: 'Outfit', sans-serif; outline: none; transition: all 0.15s;
        }
        .ai-assistant-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .ai-assistant-input::placeholder { color: #9ca3af; }
        .ai-assistant-btn {
          padding: 10px 24px; font-size: 14px; font-weight: 600; color: #fff;
          background: #0d9488; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: background 0.15s;
        }
        .ai-assistant-btn:hover { background: #0f766e; }
        .ai-assistant-btn:disabled { background: #9ca3af; cursor: not-allowed; }
      `}</style>

      {/* Controls */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
          AI Data Quality Analysis
        </h3>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="ai-assistant-checkbox"
              checked={providers.claude}
              onChange={(e) => setProviders((p) => ({ ...p, claude: e.target.checked }))}
            />
            Claude
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="ai-assistant-checkbox"
              checked={providers.gemini}
              onChange={(e) => setProviders((p) => ({ ...p, gemini: e.target.checked }))}
            />
            Gemini
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="ai-assistant-input"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Optional: describe your analysis goal..."
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            className="ai-assistant-btn"
            onClick={handleAnalyze}
            disabled={busy || (!providers.claude && !providers.gemini)}
          >
            {busy ? 'Analyzing...' : 'Analyze Data Quality'}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {busy && !dataInsights && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px' }}>Analyzing your data with AI...</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>This may take a minute as multiple providers process your dataset.</p>
        </div>
      )}

      {/* Results */}
      {claude?.success && <ProviderResults result={claude} providerName="Claude" />}
      {gemini?.success && <ProviderResults result={gemini} providerName="Gemini" />}

      {/* Provider Comparison */}
      {comparison && (claude?.success || gemini?.success) && (
        <CardSection title="Provider Comparison">
          {comparison.agreement.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', margin: '0 0 8px' }}>Agreements</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                {comparison.agreement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
          {comparison.disagreement.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Disagreements</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                {comparison.disagreement.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
          {comparison.unique_insights && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Unique Insights</h4>
              {comparison.unique_insights.claude?.biases_detected && comparison.unique_insights.claude.biases_detected.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Claude:</span>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                    {comparison.unique_insights.claude.biases_detected.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {comparison.unique_insights.gemini?.biases_detected && comparison.unique_insights.gemini.biases_detected.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Gemini:</span>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                    {comparison.unique_insights.gemini.biases_detected.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardSection>
      )}

      {!dataInsights && !busy && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <p style={{ fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
            Select providers and click "Analyze Data Quality" to get AI-powered insights about your dataset's quality, biases, features, and ML readiness.
          </p>
        </div>
      )}
    </motion.div>
  );
};
