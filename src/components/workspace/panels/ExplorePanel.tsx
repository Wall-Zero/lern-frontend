import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { Button } from '../../common/Button';

export const ExplorePanel = () => {
  const { state, toggleMarketplace, runAnalysis } = useWorkspace();
  const { activeDataset, previewData, previewColumns } = state;
  const [intent, setIntent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  return (
    <div style={{ padding: '24px', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .explore-panel { font-family: 'Outfit', sans-serif; }

        /* Secondary button */
        .explore-external-btn {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Outfit', sans-serif;
        }
        .explore-external-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        /* Column tags */
        .explore-column-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #374151;
          font-family: 'Outfit', sans-serif;
          transition: all 0.15s;
        }
        .explore-column-tag:hover {
          background: #f0fdfa;
          color: #0d9488;
        }
        .explore-column-type {
          color: #9ca3af;
        }

        /* Data table - matches preview-data-table from DatasetsList */
        .explore-data-table {
          width: 100%;
          overflow-x: auto;
        }
        .explore-data-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .explore-data-table th {
          text-align: left;
          padding: 10px 12px;
          background: #f3f4f6;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          font-family: 'JetBrains Mono', monospace;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .explore-data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'JetBrains Mono', monospace;
          color: #374151;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .explore-data-table td.row-num {
          color: #9ca3af;
          font-size: 12px;
          width: 48px;
        }
        .explore-data-table tr:hover td {
          background: #f9fafb;
        }
        .explore-data-table .null-value {
          color: #d1d5db;
          font-style: italic;
        }

        /* AI Insights input */
        .explore-insights-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.15s;
        }
        .explore-insights-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        .explore-insights-input::placeholder {
          color: #9ca3af;
        }
      `}</style>

      <div className="explore-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#111827',
              margin: '0 0 4px 0'
            }}>{activeDataset.name}</h1>
            <p style={{
              fontSize: '13px',
              color: '#6b7280',
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {activeDataset.row_count} rows &middot; {previewColumns.length} columns &middot; {activeDataset.type.toUpperCase()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleMarketplace}
              className="explore-external-btn"
            >
              + External Data
            </button>
          </div>
        </div>

        {/* Column summary */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 12px 0'
          }}>Columns</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activeDataset.columns.map((col) => (
              <span
                key={col.name}
                className="explore-column-tag"
              >
                {col.name}
                <span className="explore-column-type">({col.type})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Data table */}
        {previewData && previewData.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div className="explore-data-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>#</th>
                    {previewColumns.map((col) => (
                      <th key={col}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td className="row-num">{i + 1}</td>
                      {previewColumns.map((col) => (
                        <td key={col}>
                          {row[col] != null ? String(row[col]) : <span className="null-value">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 20 && (
              <div style={{
                padding: '8px 16px',
                background: '#f9fafb',
                fontSize: '12px',
                color: '#6b7280',
                borderTop: '1px solid #e5e7eb',
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                Showing 20 of {previewData.length} preview rows ({activeDataset.row_count} total)
              </div>
            )}
          </div>
        )}

        {/* AI Insights prompt */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            border: '1px solid #99f6e4',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            margin: '0 0 8px 0'
          }}>Get AI Insights</h3>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px 0',
            lineHeight: 1.5
          }}>
            Describe what you want to predict or analyze, and AI will suggest the best approach.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGetInsights()}
              placeholder="e.g., I want to predict house prices based on features..."
              className="explore-insights-input"
            />
            <Button
              onClick={handleGetInsights}
              isLoading={isAnalyzing}
              disabled={!intent.trim() || isAnalyzing}
            >
              Analyze
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
