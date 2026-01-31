import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWorkspace } from '../../../context/WorkspaceContext';

const ScaleIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const DataIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  </svg>
);

export const UploadPanel = () => {
  const { state, setUserIntent, uploadDataset, selectDataset } = useWorkspace();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mode = state.workspaceMode;
  const userIntent = state.userIntent;

  const modeConfig = {
    legal: {
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      lightBg: '#f5f3ff',
      borderColor: '#ddd6fe',
      icon: <ScaleIcon />,
      title: 'Legal Assistant',
      subtitle: 'Analyze contracts, draft motions, research case law',
      placeholder: "Describe your legal task...\n\nExamples:\n• Review this contract and identify risks\n• Draft a motion to suppress evidence under Charter s.8\n• Find case law on unreasonable search and seizure\n• Analyze this disclosure for Brady material",
      accept: '.pdf,.doc,.docx,.txt,.md',
    },
    data: {
      color: '#0d9488',
      bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      lightBg: '#f0fdfa',
      borderColor: '#99f6e4',
      icon: <DataIcon />,
      title: 'Data Analyst',
      subtitle: 'Analyze datasets, find patterns, train ML models',
      placeholder: "Describe what you want to analyze...\n\nExamples:\n• Find patterns in customer purchase behavior\n• Predict which customers are likely to churn\n• Identify correlations between sales and weather\n• Clean and prepare this data for machine learning",
      accept: '.csv,.xlsx,.xls,.json',
    },
  };

  const config = modeConfig[mode];

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const datasetId = e.dataTransfer.getData('application/x-dataset-id');
    if (datasetId) {
      selectDataset(Number(datasetId));
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !name) return;
    setIsUploading(true);
    try {
      await uploadDataset(selectedFile, name);
      setSelectedFile(null);
      setName('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStart = () => {
    // For now, just log - this will be connected to actual processing
    console.log('Starting with intent:', userIntent);
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: config.lightBg, color: config.color }}
          >
            {config.icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-500">{config.subtitle}</p>
        </div>

        {/* Main Input Area */}
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{ border: `2px solid ${config.borderColor}` }}
        >
          {/* Text Input */}
          <div className="bg-white">
            <textarea
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder={config.placeholder}
              className="w-full resize-none focus:outline-none p-6"
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                minHeight: '180px',
                border: 'none',
              }}
            />
          </div>

          {/* Divider with file upload option */}
          <div
            className="flex items-center gap-4 px-6 py-3"
            style={{ background: config.lightBg, borderTop: `1px solid ${config.borderColor}` }}
          >
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">attach files (optional)</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* File Drop Zone */}
          <div
            className="p-4 bg-white cursor-pointer transition-all"
            style={{
              background: isDragOver ? config.lightBg : selectedFile ? config.lightBg : '#fafafa',
            }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: config.color + '20', color: config.color }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setName(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm">Drop files here or click to browse</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="p-4 bg-white border-t border-gray-100">
            <button
              onClick={selectedFile ? handleSubmit : handleStart}
              disabled={isUploading || (!userIntent.trim() && !selectedFile)}
              className="w-full py-3 px-6 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: config.bgGradient,
                boxShadow: `0 4px 14px ${config.color}40`,
              }}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : selectedFile ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload & Analyze
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {mode === 'legal' ? (
            <>
              <QuickChip label="Review contract" onClick={() => setUserIntent('Review this contract and identify potential risks and concerns')} color={config.color} />
              <QuickChip label="Draft motion" onClick={() => setUserIntent('Draft a motion to suppress evidence under Charter s.8')} color={config.color} />
              <QuickChip label="Find case law" onClick={() => setUserIntent('Find relevant case law on unreasonable search and seizure')} color={config.color} />
            </>
          ) : (
            <>
              <QuickChip label="Find patterns" onClick={() => setUserIntent('Find patterns and trends in this dataset')} color={config.color} />
              <QuickChip label="Predict outcomes" onClick={() => setUserIntent('Build a model to predict outcomes based on this data')} color={config.color} />
              <QuickChip label="Data quality" onClick={() => setUserIntent('Analyze data quality and suggest improvements')} color={config.color} />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const QuickChip = ({ label, onClick, color }: { label: string; onClick: () => void; color: string }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-sm rounded-full transition-all hover:scale-105"
    style={{
      background: color + '10',
      color: color,
      border: `1px solid ${color}30`,
    }}
  >
    {label}
  </button>
);
