import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DatasetMetadata } from '../../../../types/workspace.types';

interface DataTableTabProps {
  previewData: Record<string, any>[];
  previewColumns: string[];
  metadata: DatasetMetadata | null;
  totalRows: number;
}

type SortDir = 'none' | 'asc' | 'desc';

const cycleSortDir = (dir: SortDir): SortDir => {
  if (dir === 'none') return 'asc';
  if (dir === 'asc') return 'desc';
  return 'none';
};

const SortIndicator = ({ dir }: { dir: SortDir }) => {
  if (dir === 'none') {
    return <span style={{ color: '#d1d5db', marginLeft: '4px', fontSize: '10px' }}>⇅</span>;
  }
  return (
    <span style={{ color: '#0d9488', marginLeft: '4px', fontSize: '10px' }}>
      {dir === 'asc' ? '▲' : '▼'}
    </span>
  );
};

export const DataTableTab = ({ previewData, previewColumns, metadata, totalRows }: DataTableTabProps) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('none');

  const handleHeaderClick = (col: string) => {
    if (sortCol === col) {
      const next = cycleSortDir(sortDir);
      setSortDir(next);
      if (next === 'none') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortCol || sortDir === 'none') return previewData;
    return [...previewData].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const sa = String(av);
      const sb = String(bv);
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [previewData, sortCol, sortDir]);

  const colMeta = useMemo(() => {
    if (!metadata) return {};
    const map: Record<string, { type: string; null_count: number }> = {};
    metadata.columns.forEach((c) => {
      map[c.name] = { type: c.type, null_count: c.null_count };
    });
    return map;
  }, [metadata]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}
    >
      <style>{`
        .data-table-tab th { cursor: pointer; user-select: none; }
        .data-table-tab th:hover { background: #f0fdfa !important; }
        .data-table-tab tr:hover td { background: #f9fafb; }
        .data-table-tab .null-cell { background: rgba(239, 68, 68, 0.05); }
      `}</style>
      <div className="data-table-tab" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th
                style={{
                  width: '48px',
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: '#f3f4f6',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#4b5563',
                  fontFamily: "'JetBrains Mono', monospace",
                  borderBottom: '1px solid #e5e7eb',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                #
              </th>
              {previewColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleHeaderClick(col)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: '#f3f4f6',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#4b5563',
                    fontFamily: "'JetBrains Mono', monospace",
                    borderBottom: '1px solid #e5e7eb',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {col}
                      <SortIndicator dir={sortCol === col ? sortDir : 'none'} />
                    </div>
                    {colMeta[col] && (
                      <span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af', textTransform: 'none', letterSpacing: 0, marginTop: '2px' }}>
                        {colMeta[col].type}{colMeta[col].null_count > 0 ? ` · ${colMeta[col].null_count} nulls` : ''}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: '10px 12px',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', monospace",
                    borderBottom: '1px solid #f3f4f6',
                    width: '48px',
                  }}
                >
                  {i + 1}
                </td>
                {previewColumns.map((col) => {
                  const isNull = row[col] == null;
                  return (
                    <td
                      key={col}
                      className={isNull ? 'null-cell' : ''}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #f3f4f6',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isNull ? '#d1d5db' : '#374151',
                        fontStyle: isNull ? 'italic' : 'normal',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isNull ? 'null' : String(row[col])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          padding: '8px 16px',
          background: '#f9fafb',
          fontSize: '12px',
          color: '#6b7280',
          borderTop: '1px solid #e5e7eb',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        Showing {sortedData.length} preview rows ({totalRows.toLocaleString()} total)
        {sortCol && sortDir !== 'none' && (
          <span style={{ marginLeft: '12px', color: '#0d9488' }}>
            Sorted by {sortCol} ({sortDir})
          </span>
        )}
      </div>
    </motion.div>
  );
};
