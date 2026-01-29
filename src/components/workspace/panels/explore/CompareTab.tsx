import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Dataset, MultiDatasetInsightsResponse } from '../../../../types/dataset.types';
import type { DatasetMetadata, CompareMetadata, ComparePreviewData } from '../../../../types/workspace.types';

interface CompareTabProps {
  compareDatasets: Dataset[];
  compareMetadata: CompareMetadata;
  comparePreviewData: ComparePreviewData;
  multiDatasetInsights: MultiDatasetInsightsResponse | null;
  onFetchInsights: (intent?: string) => void;
  isProcessing: boolean;
}

const formatNumber = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to get column names from metadata or dataset
const getColumnNames = (dataset: Dataset, metadata?: DatasetMetadata): string[] => {
  if (metadata?.columns) {
    return metadata.columns.map((c) => c.name);
  }
  return dataset.columns.map((c) => c.name);
};

// Helper to get column type from metadata or dataset
const getColumnType = (dataset: Dataset, columnName: string, metadata?: DatasetMetadata): string => {
  if (metadata?.columns) {
    const col = metadata.columns.find((c) => c.name === columnName);
    if (col) return col.type;
  }
  const col = dataset.columns.find((c) => c.name === columnName);
  return col?.type || 'unknown';
};

export const CompareTab = ({
  compareDatasets,
  compareMetadata,
  multiDatasetInsights,
  onFetchInsights,
  isProcessing,
}: CompareTabProps) => {
  const [intent, setIntent] = useState('');

  if (compareDatasets.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
        <svg
          style={{ margin: '0 auto 16px', display: 'block' }}
          height="48"
          width="48"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <p style={{ fontSize: '15px', marginBottom: '8px' }}>Select 2 or more datasets to compare</p>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          Use the checkboxes in the sidebar to select datasets for comparison
        </p>
      </div>
    );
  }

  // Calculate column overlap
  const allColumnSets = compareDatasets.map((ds) => {
    const meta = compareMetadata[ds.id];
    return new Set(getColumnNames(ds, meta));
  });

  const commonColumns = [...allColumnSets[0]].filter((col) =>
    allColumnSets.every((set) => set.has(col))
  );

  const uniqueColumnsByDataset: Record<number, string[]> = {};
  compareDatasets.forEach((ds, idx) => {
    const otherSets = allColumnSets.filter((_, i) => i !== idx);
    const unique = [...allColumnSets[idx]].filter((col) => !otherSets.every((set) => set.has(col)));
    uniqueColumnsByDataset[ds.id] = unique;
  });

  const allUniqueColumns = new Set<string>();
  allColumnSets.forEach((set) => set.forEach((col) => allUniqueColumns.add(col)));

  const crossAnalysis = multiDatasetInsights?.cross_dataset_analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Dataset Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(compareDatasets.length, 3)}, 1fr)`, gap: '16px' }}>
        {compareDatasets.map((ds) => {
          const meta = compareMetadata[ds.id];
          return (
            <div
              key={ds.id}
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 12px 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {ds.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Rows</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatNumber(meta?.row_count ?? ds.row_count)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Columns</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatNumber(meta?.column_count ?? ds.columns.length)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Size</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                    {meta ? `${meta.memory_usage_mb} MB` : formatSize(ds.file_size)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>Type</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>
                    {ds.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Column Overlap Analysis */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
          Column Overlap Analysis
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', fontFamily: "'JetBrains Mono', monospace" }}>
              {commonColumns.length}
            </div>
            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>Common Columns</div>
          </div>
          <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#d97706', fontFamily: "'JetBrains Mono', monospace" }}>
              {allUniqueColumns.size}
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>Total Unique</div>
          </div>
          {compareDatasets.map((ds) => (
            <div key={ds.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#374151', fontFamily: "'JetBrains Mono', monospace" }}>
                {uniqueColumnsByDataset[ds.id]?.length ?? 0}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Only in {ds.name.slice(0, 15)}
              </div>
            </div>
          ))}
        </div>

        {/* Common columns detail */}
        {commonColumns.length > 0 && (
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
              Common Columns ({commonColumns.length})
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: '#f9fafb',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6b7280',
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Column
                    </th>
                    {compareDatasets.map((ds) => (
                      <th
                        key={ds.id}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: '#f9fafb',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#6b7280',
                          fontFamily: "'JetBrains Mono', monospace",
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '1px solid #e5e7eb',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '150px',
                        }}
                      >
                        {ds.name.slice(0, 20)}
                      </th>
                    ))}
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '10px 12px',
                        background: '#f9fafb',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#6b7280',
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commonColumns.slice(0, 20).map((col) => {
                    const types = compareDatasets.map((ds) => getColumnType(ds, col, compareMetadata[ds.id]));
                    const allMatch = types.every((t) => t === types[0]);
                    return (
                      <tr key={col} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                          {col}
                        </td>
                        {types.map((type, idx) => (
                          <td key={idx} style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: type === 'numeric' ? '#ede9fe' : type === 'datetime' ? '#e0f2fe' : '#fef3c7',
                                color: type === 'numeric' ? '#7c3aed' : type === 'datetime' ? '#0284c7' : '#d97706',
                              }}
                            >
                              {type}
                            </span>
                          </td>
                        ))}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {allMatch ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓</span>
                          ) : (
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {commonColumns.length > 20 && (
                <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '12px' }}>
                  ... and {commonColumns.length - 20} more common columns
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cross-Dataset AI Analysis */}
      {crossAnalysis && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
            AI Cross-Dataset Analysis
          </h3>

          {/* Usefulness Assessment */}
          <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', background: crossAnalysis.datasets_useful_together ? '#f0fdf4' : '#fef2f2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '20px',
              }}>
                {crossAnalysis.datasets_useful_together ? '✓' : '✗'}
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: crossAnalysis.datasets_useful_together ? '#16a34a' : '#dc2626',
              }}>
                {crossAnalysis.datasets_useful_together ? 'Datasets are useful together' : 'Datasets may not be related'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
              {crossAnalysis.usefulness_explanation}
            </p>
          </div>

          {/* Enrichment Opportunities */}
          {crossAnalysis.enrichment_opportunities && crossAnalysis.enrichment_opportunities.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
                Enrichment Opportunities
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {crossAnalysis.enrichment_opportunities.map((opp, idx) => {
                  const sourceDs = compareDatasets.find((d) => d.id === opp.source_dataset_id);
                  const targetDs = compareDatasets.find((d) => d.id === opp.target_dataset_id);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        background: '#f0f9ff',
                        borderRadius: '8px',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
                          {sourceDs?.name || `Dataset ${opp.source_dataset_id}`}
                        </span>
                        <span style={{ color: '#64748b' }}>→</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>
                          {targetDs?.name || `Dataset ${opp.target_dataset_id}`}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px 0' }}>
                        {opp.description}
                      </p>
                      {opp.columns_to_add && opp.columns_to_add.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Columns to add:</span>
                          {opp.columns_to_add.map((col) => (
                            <span
                              key={col}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 500,
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      )}
                      {opp.join_on && (
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>
                          Join on: <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7c3aed' }}>{opp.join_on}</code>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schema Compatibility */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
              Schema Compatibility
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: crossAnalysis.schema_compatibility.can_merge ? '#dcfce7' : '#fee2e2',
                  color: crossAnalysis.schema_compatibility.can_merge ? '#16a34a' : '#dc2626',
                }}
              >
                {crossAnalysis.schema_compatibility.can_merge ? '✓ Can be merged' : '✗ Cannot merge'}
              </span>
            </div>
            {crossAnalysis.schema_compatibility.suggested_join_keys.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Suggested join keys: </span>
                {crossAnalysis.schema_compatibility.suggested_join_keys.map((key) => (
                  <span
                    key={key}
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      marginLeft: '6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: '#f0fdf4',
                      color: '#16a34a',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {key}
                  </span>
                ))}
              </div>
            )}
            {crossAnalysis.schema_compatibility.type_conflicts.length > 0 && (
              <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', margin: '0 0 8px 0' }}>Type Conflicts:</p>
                {crossAnalysis.schema_compatibility.type_conflicts.map((conflict, idx) => (
                  <p key={idx} style={{ fontSize: '12px', color: '#991b1b', margin: '4px 0' }}>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{conflict.column}</code>: {conflict.types.join(' vs ')}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Merge Recommendation */}
          {crossAnalysis.merge_recommendations && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
                Merge Recommendation
              </h4>
              <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Strategy:</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#dcfce7',
                      color: '#16a34a',
                      textTransform: 'uppercase',
                    }}
                  >
                    {crossAnalysis.merge_recommendations.strategy}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                  {crossAnalysis.merge_recommendations.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Correlations */}
          {crossAnalysis.correlations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
                Potential Correlations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {crossAnalysis.correlations.slice(0, 5).map((corr, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#7c3aed' }}>
                      {corr.dataset_a_column}
                    </code>
                    <span style={{ color: '#9ca3af' }}>↔</span>
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#0284c7' }}>
                      {corr.dataset_b_column}
                    </code>
                    <span style={{ flex: 1, fontSize: '12px', color: '#6b7280' }}>{corr.relationship}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: corr.confidence >= 0.7 ? '#dcfce7' : '#fef3c7',
                        color: corr.confidence >= 0.7 ? '#16a34a' : '#d97706',
                      }}
                    >
                      {Math.round(corr.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Combined Insights */}
          {crossAnalysis.combined_insights && crossAnalysis.combined_insights.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
                Combined Analysis Insights
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {crossAnalysis.combined_insights.map((insight, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#374151', marginBottom: '8px', lineHeight: 1.5 }}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Quality Comparison */}
          {crossAnalysis.data_quality_comparison && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
                Data Quality Comparison
              </h4>
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                {crossAnalysis.data_quality_comparison.better_quality_dataset && (
                  <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px 0' }}>
                    <strong>Better quality:</strong>{' '}
                    {compareDatasets.find((d) => d.id === crossAnalysis.data_quality_comparison.better_quality_dataset)?.name ||
                     `Dataset ${crossAnalysis.data_quality_comparison.better_quality_dataset}`}
                  </p>
                )}
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {crossAnalysis.data_quality_comparison.quality_notes}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Get AI Insights section */}
      {!multiDatasetInsights && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', margin: '0 0 8px 0' }}>
            Analyze Datasets Together
          </h3>
          <p style={{ fontSize: '13px', color: '#a16207', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Describe what you want to analyze. The AI will examine both datasets, find correlations, and suggest how they can enrich each other.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Examples:
• Analyze these legal documents for compliance patterns
• Find correlations between sales data and customer demographics
• How can these datasets improve my ML model?
• Are there matching entities across these datasets?"
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px 16px',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: "'Outfit', sans-serif",
                resize: 'vertical',
                outline: 'none',
                background: '#fffbeb',
              }}
            />
            <button
              onClick={() => onFetchInsights(intent || undefined)}
              disabled={isProcessing}
              style={{
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                background: isProcessing ? '#9ca3af' : '#d97706',
                border: 'none',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'background 0.15s',
                alignSelf: 'flex-start',
              }}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
