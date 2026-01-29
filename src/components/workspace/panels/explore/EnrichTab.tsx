import { useState } from 'react';
import { motion } from 'framer-motion';
import { marketplaceApi } from '../../../../api/endpoints/marketplace';
import type { AISuggestion, EnrichResponse } from '../../../../types/marketplace.types';

interface EnrichTabProps {
  dataSourceId: number;
  onOpenMarketplace: () => void;
}

const RelevanceBar = ({ score }: { score: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ width: '60px', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(score * 100, 100)}%`,
          height: '100%',
          borderRadius: '3px',
          background: score >= 0.7 ? '#10b981' : score >= 0.4 ? '#f59e0b' : '#ef4444',
        }}
      />
    </div>
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
      {(score * 100).toFixed(0)}%
    </span>
  </div>
);

export const EnrichTab = ({ dataSourceId, onOpenMarketplace }: EnrichTabProps) => {
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null);
  const [generalRecs, setGeneralRecs] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedContext, setAdvancedContext] = useState('');
  const [enrichResult, setEnrichResult] = useState<EnrichResponse | null>(null);
  const [loadingEnrich, setLoadingEnrich] = useState(false);

  const handleGetSuggestions = async () => {
    if (!context.trim()) return;
    setLoadingSuggestions(true);
    try {
      const res = await marketplaceApi.getSuggestions({
        data_source_id: dataSourceId,
        context: context,
      });
      setSuggestions(res.suggestions?.suggestions || []);
      setGeneralRecs(res.suggestions?.general_recommendations || []);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleEnrich = async () => {
    if (!advancedContext.trim()) return;
    setLoadingEnrich(true);
    try {
      const res = await marketplaceApi.enrichWithContext({
        data_source_id: dataSourceId,
        context: advancedContext,
      });
      setEnrichResult(res);
    } catch (err) {
      console.error('Failed to enrich:', err);
    } finally {
      setLoadingEnrich(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      <style>{`
        .enrich-input {
          width: 100%; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; font-family: 'Outfit', sans-serif; outline: none; transition: all 0.15s;
          resize: vertical; min-height: 60px;
        }
        .enrich-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .enrich-input::placeholder { color: #9ca3af; }
        .enrich-btn {
          padding: 10px 24px; font-size: 14px; font-weight: 600; color: #fff;
          background: #0d9488; border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: background 0.15s;
        }
        .enrich-btn:hover { background: #0f766e; }
        .enrich-btn:disabled { background: #9ca3af; cursor: not-allowed; }
        .enrich-add-btn {
          padding: 6px 14px; font-size: 12px; font-weight: 600; color: #0d9488;
          background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: all 0.15s;
        }
        .enrich-add-btn:hover { background: #ccfbf1; }
        .enrich-toggle {
          background: none; border: none; cursor: pointer; font-size: 14px;
          font-weight: 600; color: #0d9488; font-family: 'Outfit', sans-serif;
          padding: 0; display: flex; align-items: center; gap: 6px;
        }
        .enrich-toggle:hover { color: #0f766e; }
      `}</style>

      {/* Suggestions input */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>
          External Data Recommendations
        </h3>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Describe your analysis goals and get AI-powered suggestions for external datasets that could improve your model.
        </p>
        <textarea
          className="enrich-input"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., I want to predict stock prices and need economic indicators..."
        />
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="enrich-btn"
            onClick={handleGetSuggestions}
            disabled={loadingSuggestions || !context.trim()}
          >
            {loadingSuggestions ? 'Finding suggestions...' : 'Get Suggestions'}
          </button>
        </div>
      </div>

      {/* Suggestion results */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestions.map((sug, i) => (
            <div
              key={i}
              style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
                    {sug.series_name || sug.series_id}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                    {sug.series_id}
                  </span>
                </div>
                <RelevanceBar score={sug.relevance_score} />
              </div>
              <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>
                {sug.reasoning}
              </p>
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>
                  <strong style={{ color: '#374151' }}>How to merge:</strong> {sug.how_to_merge}
                </p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  <strong style={{ color: '#374151' }}>Expected benefit:</strong> {sug.expected_benefit}
                </p>
              </div>
              <button className="enrich-add-btn" onClick={onOpenMarketplace}>
                + Add to Dataset
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
          No suggestions found. Try a more specific description.
        </div>
      )}

      {/* General recommendations */}
      {generalRecs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>General Recommendations</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
            {generalRecs.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {/* Advanced Enrichment (collapsible) */}
      <div>
        <button className="enrich-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
          <span style={{ fontSize: '12px', transform: showAdvanced ? 'rotate(90deg)' : undefined, display: 'inline-block', transition: 'transform 0.15s' }}>
            ▶
          </span>
          Advanced Enrichment
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}
          >
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px', lineHeight: 1.5 }}>
              Get deep enrichment analysis with domain knowledge, known issues, and analysis goals.
            </p>
            <textarea
              className="enrich-input"
              value={advancedContext}
              onChange={(e) => setAdvancedContext(e.target.value)}
              placeholder="Provide detailed context about your domain, known issues, and goals..."
              style={{ minHeight: '80px' }}
            />
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="enrich-btn"
                onClick={handleEnrich}
                disabled={loadingEnrich || !advancedContext.trim()}
              >
                {loadingEnrich ? 'Enriching...' : 'Enrich with Context'}
              </button>
            </div>

            {enrichResult && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {enrichResult.understanding && (
                  <div style={{ padding: '12px', background: '#f0fdfa', borderRadius: '8px', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                    <strong>Understanding:</strong> {enrichResult.understanding}
                  </div>
                )}
                {enrichResult.prioritized_recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Prioritized Recommendations</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                      {enrichResult.prioritized_recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </div>
                )}
                {enrichResult.potential_pitfalls.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px' }}>Potential Pitfalls</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                      {enrichResult.potential_pitfalls.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {enrichResult.next_steps.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Next Steps</h4>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
                      {enrichResult.next_steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
                {enrichResult.external_data_suggestions.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>Additional Data Suggestions</h4>
                    {enrichResult.external_data_suggestions.map((sug, i) => (
                      <div key={i} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>{sug.series_name || sug.series_id}</span>
                          <RelevanceBar score={sug.relevance_score} />
                        </div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{sug.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
