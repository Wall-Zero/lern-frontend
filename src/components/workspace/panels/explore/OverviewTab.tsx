import { motion } from 'framer-motion';
import type { Dataset } from '../../../../types/dataset.types';
import type { DatasetMetadata, ColumnMetadata } from '../../../../types/workspace.types';
import type { DataInsightsResponse } from '../../../../types/dataset.types';

interface OverviewTabProps {
  dataset: Dataset;
  metadata: DatasetMetadata | null;
  dataInsights: DataInsightsResponse | null;
  onRunAnalysis: () => void;
  isProcessing: boolean;
}

const typeBreakdown = (columns: ColumnMetadata[]) => {
  const counts: Record<string, number> = {};
  columns.forEach((c) => {
    counts[c.type] = (counts[c.type] || 0) + 1;
  });
  return counts;
};

const getNullPercent = (col: ColumnMetadata, totalRows: number) => {
  if (totalRows === 0) return 0;
  return (col.null_count / totalRows) * 100;
};

const getNullColor = (pct: number) => {
  if (pct === 0) return '#10b981';
  if (pct < 5) return '#f59e0b';
  if (pct < 20) return '#f97316';
  return '#ef4444';
};

const formatNumber = (n: number | null | undefined) => {
  if (n == null) return '—';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const OverviewTab = ({ dataset, metadata, dataInsights, onRunAnalysis, isProcessing }: OverviewTabProps) => {
  const types = metadata ? typeBreakdown(metadata.columns) : {};
  const provider = dataInsights?.analyses?.claude ?? dataInsights?.analyses?.gemini ?? null;
  const quality = provider?.data_quality ?? null;
  const totalRows = metadata?.row_count ?? dataset.row_count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Rows', value: formatNumber(totalRows) },
          { label: 'Columns', value: formatNumber(metadata?.column_count ?? dataset.columns.length) },
          { label: 'Memory', value: metadata ? `${metadata.memory_usage_mb} MB` : '—' },
          ...Object.entries(types).map(([t, c]) => ({
            label: t.charAt(0).toUpperCase() + t.slice(1),
            value: String(c),
          })),
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500, marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Column statistics table */}
      {metadata && metadata.columns.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Column Statistics</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Column', 'Type', 'Nulls', 'Unique', 'Min', 'Max', 'Mean', 'Std'].map((h) => (
                    <th
                      key={h}
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
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metadata.columns.map((col) => {
                  const nullPct = getNullPercent(col, totalRows);
                  return (
                    <tr key={col.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                        {col.name}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: col.type === 'numeric' ? '#ede9fe' : col.type === 'datetime' ? '#e0f2fe' : '#fef3c7',
                            color: col.type === 'numeric' ? '#7c3aed' : col.type === 'datetime' ? '#0284c7' : '#d97706',
                          }}
                        >
                          {col.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '48px', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(nullPct, 100)}%`,
                                height: '100%',
                                background: getNullColor(nullPct),
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace" }}>
                            {col.null_count} ({nullPct.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>
                        {formatNumber(col.unique_values)}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>
                        {col.type === 'numeric' ? formatNumber(col.stats.min as number) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>
                        {col.type === 'numeric' ? formatNumber(col.stats.max as number) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>
                        {col.type === 'numeric' ? formatNumber(col.stats.mean as number) : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>
                        {col.type === 'numeric' ? formatNumber(col.stats.std as number) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data quality scores */}
      {quality && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
            Data Quality Scores
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Overall', score: quality.overall_score },
              { label: 'Completeness', score: quality.completeness.score },
              { label: 'Consistency', score: quality.consistency.score },
              { label: 'Accuracy', score: quality.accuracy.score },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.score}/10
                  </span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(item.score / 10) * 100}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: item.score >= 7 ? '#10b981' : item.score >= 4 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {quality.completeness.recommendation && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              <strong style={{ color: '#374151' }}>Recommendation:</strong> {quality.completeness.recommendation}
            </div>
          )}
        </div>
      )}

      {/* Run AI Analysis button */}
      {!dataInsights && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <button
            onClick={onRunAnalysis}
            disabled={isProcessing}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: isProcessing ? '#9ca3af' : '#0d9488',
              border: 'none',
              borderRadius: '8px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'background 0.15s',
            }}
          >
            {isProcessing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      )}
    </motion.div>
  );
};
