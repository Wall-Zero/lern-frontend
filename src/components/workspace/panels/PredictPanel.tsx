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
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No trained model available. Train a model first.</p>
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Model info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Make Predictions</h1>
            <p className="text-sm text-gray-500 mt-1">
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
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">{key}</p>
                <p className="text-lg font-bold text-gray-900">
                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload CSV for prediction */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Prediction Data</h3>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            selectedFile ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
          }`}
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
              <svg className="mx-auto h-8 w-8 text-primary-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600">Upload a CSV file with the same features</p>
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
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Predictions ({results.summary?.count || results.predictions.length})
            </h3>
            <button
              onClick={handleDownload}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  {results.predictions[0] &&
                    Object.keys(results.predictions[0]).map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.predictions.slice(0, 50).map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-400">{i + 1}</td>
                    {Object.values(row).map((val: any, j: number) => (
                      <td key={j} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {val != null ? String(typeof val === 'number' ? val.toFixed(4) : val) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.predictions.length > 50 && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-200">
              Showing 50 of {results.predictions.length} predictions
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
