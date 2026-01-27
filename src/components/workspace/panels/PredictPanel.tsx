import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { workspaceApi } from '../../../api/endpoints/workspace';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import toast from 'react-hot-toast';

export const PredictPanel = () => {
  const { state } = useWorkspace();
  const { activeTool } = state;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeTool || activeTool.status !== 'trained') {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#9ca3af' }}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p style={{ fontFamily: '"Outfit", sans-serif' }}>No trained model available. Train a model first.</p>
        </div>
      </div>
    );
  }

  const version = activeTool.active_version_data;

  const handlePredict = async () => {
    if (!selectedFile) return;
    setIsPredicting(true);
    try {
      const data = await workspaceApi.predict(activeTool.id, selectedFile);
      setResults(data);
      toast.success(`${data.summary?.count || 0} predictions generated`);
    } catch (err) {
      console.error('Prediction failed:', err);
      toast.error('Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleDownload = () => {
    if (!results?.predictions) return;
    const rows = results.predictions;
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map((r: any) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .predict-panel {
          font-family: 'Outfit', sans-serif;
          background: #f9fafb;
        }
        .predict-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
        }
        .predict-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .predict-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #111827;
        }
        .predict-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        .predict-section-heading {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #111827;
          margin-bottom: 16px;
        }
        .predict-metric-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 12px;
        }
        .predict-metric-label {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .predict-metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .predict-upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .predict-upload-zone:hover {
          border-color: #0d9488;
          background: #f0fdfa;
        }
        .predict-upload-zone.selected {
          border-color: #0d9488;
          background: #f0fdfa;
        }
        .predict-download-link {
          font-size: 14px;
          font-weight: 500;
          color: #0d9488;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: color 0.2s ease;
        }
        .predict-download-link:hover {
          color: #0f766e;
        }
        .predict-results-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .predict-results-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .predict-data-table {
          width: 100%;
          overflow-x: auto;
        }
        .predict-data-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .predict-data-table th {
          text-align: left;
          padding: 10px 12px;
          background: #f3f4f6;
          font-size: 12px;
          font-weight: 600;
          color: #4b5563;
          font-family: 'JetBrains Mono', monospace;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .predict-data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'JetBrains Mono', monospace;
          color: #374151;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .predict-data-table tr:hover td {
          background: #f9fafb;
        }
        .predict-footer {
          padding: 8px 16px;
          background: #f9fafb;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
      <div className="p-6 space-y-6 max-w-4xl mx-auto predict-panel">
        {/* Model info */}
        <div className="predict-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="predict-heading">Make Predictions</h1>
              <p className="predict-subtitle">
                Using: {activeTool.name}
                {version && ` (v${version.version_number} - ${version.model_algorithm})`}
              </p>
            </div>
            <Badge variant="success">Trained</Badge>
          </div>

          {/* Metrics summary */}
          {version?.metrics && Object.keys(version.metrics).length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(version.metrics).map(([key, value]) => (
                <div key={key} className="predict-metric-card">
                  <p className="predict-metric-label">{key}</p>
                  <p className="predict-metric-value">
                    {typeof value === 'number' ? value.toFixed(4) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload CSV for prediction */}
        <div className="predict-card">
          <h3 className="predict-section-heading">Upload Prediction Data</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`predict-upload-zone ${selectedFile ? 'selected' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            {selectedFile ? (
              <div>
                <svg className="mx-auto h-8 w-8 mb-2" style={{ color: '#0d9488' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: '"JetBrains Mono", monospace' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-8 w-8 mb-2" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Upload a CSV file with the same features</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <Button
              onClick={handlePredict}
              isLoading={isPredicting}
              className="w-full mt-4"
            >
              Run Predictions
            </Button>
          )}
        </div>

        {/* Results */}
        {results && results.predictions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="predict-results-card"
          >
            <div className="predict-results-header">
              <h3 className="predict-section-heading" style={{ marginBottom: 0 }}>
                Predictions ({results.summary?.count || results.predictions.length})
              </h3>
              <button
                onClick={handleDownload}
                className="predict-download-link"
              >
                Download CSV
              </button>
            </div>
            <div className="predict-data-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {results.predictions[0] &&
                      Object.keys(results.predictions[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {results.predictions.slice(0, 50).map((row: any, i: number) => (
                    <tr key={i}>
                      <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j}>
                          {val != null ? String(typeof val === 'number' ? val.toFixed(4) : val) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.predictions.length > 50 && (
              <div className="predict-footer">
                Showing 50 of {results.predictions.length} predictions
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
};
