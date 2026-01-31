import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import logoImage from '../../assets/logo.png';
import { Spinner } from '../common/Spinner';

type WorkspaceMode = 'legal' | 'data';

const ScaleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const DataIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const DatasetSidebar = () => {
  const { state, selectDataset, uploadDataset, setStage, toggleCompareDataset, clearCompareDatasets } = useWorkspace();
  const [mode, setMode] = useState<WorkspaceMode>('legal');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredDatasetId, setHoveredDatasetId] = useState<number | null>(null);
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
  const [userIntent, setUserIntent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modeConfig = {
    legal: {
      label: 'Legal',
      icon: <ScaleIcon />,
      color: '#7c3aed',
      bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      lightBg: '#f5f3ff',
      accept: '.pdf,.doc,.docx,.txt,.md',
      fileTypes: ['pdf', 'doc', 'docx', 'txt', 'md', 'text'],
      description: 'Legal Documents',
      uploadText: 'PDF, Word, Text',
    },
    data: {
      label: 'Data',
      icon: <DataIcon />,
      color: '#0d9488',
      bgGradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
      lightBg: '#f0fdfa',
      accept: '.csv,.xlsx,.xls,.json',
      fileTypes: ['csv', 'xlsx', 'xls', 'json', 'excel'],
      description: 'Data Analysis',
      uploadText: 'CSV, Excel, JSON',
    },
  };

  const currentMode = modeConfig[mode];

  const handleFileSelect = async (file: File) => {
    const name = file.name.replace(/\.[^/.]+$/, '');
    setIsUploading(true);
    try {
      await uploadDataset(file, name);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter datasets based on current mode
  const filteredDatasets = state.datasets.filter((ds) => {
    const fileType = ds.type?.toLowerCase() || '';
    return currentMode.fileTypes.includes(fileType);
  });

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo - Back to Dashboard */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <img src={logoImage} alt="LERN" className="h-8 w-auto" />
        <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
          LERN
        </span>
      </Link>

      {/* Mode Toggle */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setMode('legal')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all"
            style={{
              background: mode === 'legal' ? modeConfig.legal.bgGradient : 'transparent',
              color: mode === 'legal' ? '#fff' : '#6b7280',
              fontWeight: mode === 'legal' ? 600 : 500,
              fontSize: '13px',
              boxShadow: mode === 'legal' ? '0 2px 8px rgba(124, 58, 237, 0.3)' : 'none',
            }}
          >
            <ScaleIcon />
            Legal
          </button>
          <button
            onClick={() => setMode('data')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all"
            style={{
              background: mode === 'data' ? modeConfig.data.bgGradient : 'transparent',
              color: mode === 'data' ? '#fff' : '#6b7280',
              fontWeight: mode === 'data' ? 600 : 500,
              fontSize: '13px',
              boxShadow: mode === 'data' ? '0 2px 8px rgba(13, 148, 136, 0.3)' : 'none',
            }}
          >
            <DataIcon />
            Data
          </button>
        </div>
      </div>

      {/* Intent Input */}
      <div className="mx-3 mt-3">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${currentMode.color}30`,
            background: currentMode.lightBg,
          }}
        >
          <textarea
            value={userIntent}
            onChange={(e) => setUserIntent(e.target.value)}
            placeholder={
              mode === 'legal'
                ? "What legal task do you need help with?\n\nE.g., \"Review this contract for risks\" or \"Draft a motion to suppress evidence\""
                : "What would you like to analyze?\n\nE.g., \"Find patterns in sales data\" or \"Predict customer churn\""
            }
            className="w-full resize-none focus:outline-none"
            style={{
              padding: '12px',
              fontSize: '13px',
              lineHeight: '1.5',
              minHeight: '100px',
              background: 'transparent',
              color: '#374151',
              border: 'none',
            }}
          />
          {userIntent.trim() && (
            <div
              className="px-3 py-2 flex justify-end"
              style={{ borderTop: `1px solid ${currentMode.color}20` }}
            >
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: currentMode.bgGradient }}
                onClick={() => {
                  // TODO: Process intent
                  console.log('Processing intent:', userIntent);
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Divider with "or" */}
      <div className="flex items-center gap-3 mx-3 my-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or upload files</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Upload dropzone */}
      <div
        className="mx-3 p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all"
        style={
          isDragOver
            ? { borderColor: currentMode.color, background: currentMode.lightBg }
            : isDropzoneHovered
              ? { borderColor: currentMode.color + '80', background: '#f9fafb' }
              : { borderColor: '#e5e7eb', background: '#fafafa' }
        }
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={() => setIsDropzoneHovered(true)}
        onMouseLeave={() => setIsDropzoneHovered(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={currentMode.accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />
        {isUploading ? (
          <Spinner />
        ) : (
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: currentMode.lightBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg className="w-4 h-4" style={{ color: currentMode.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">Drop files here</p>
              <p className="text-xs text-gray-400">{currentMode.uploadText}</p>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <AnimatePresence>
          {filteredDatasets.map((ds) => {
            const isActive = state.activeDataset?.id === ds.id;
            const isHovered = hoveredDatasetId === ds.id;
            const isInCompare = state.compareDatasets.some((c) => c.id === ds.id);

            return (
              <motion.div
                key={ds.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onMouseEnter={() => setHoveredDatasetId(ds.id)}
                onMouseLeave={() => setHoveredDatasetId(null)}
                className="w-full rounded-lg transition-colors"
                style={{
                  ...(isActive
                    ? { background: currentMode.lightBg, border: `1px solid ${currentMode.color}40` }
                    : isInCompare
                      ? { background: '#fef3c7', border: '1px solid #fcd34d' }
                      : isHovered
                        ? { background: '#f9fafb', border: '1px solid transparent' }
                        : { border: '1px solid transparent' }),
                }}
              >
                <div className="flex items-center gap-2 p-3">
                  {/* Checkbox for comparison */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompareDataset(ds.id);
                    }}
                    className="flex-shrink-0 cursor-pointer"
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: isInCompare ? '2px solid #d97706' : '2px solid #d1d5db',
                      background: isInCompare ? '#fbbf24' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isInCompare && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <button
                    draggable
                    onDragStart={(e) => {
                      const de = e as unknown as React.DragEvent;
                      de.dataTransfer.setData('application/x-dataset-id', String(ds.id));
                      de.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => selectDataset(ds.id)}
                    className="flex-1 text-left min-w-0"
                    style={{ cursor: 'grab', background: 'transparent', border: 'none', padding: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: isActive ? currentMode.color : isInCompare ? '#d97706' : '#9ca3af' }}>
                        <DocumentIcon />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: isActive ? currentMode.color : isInCompare ? '#92400e' : '#111827' }}
                        >
                          {ds.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ds.row_count > 0 ? `${ds.row_count} rows` : ds.type?.toUpperCase()} · {formatSize(ds.file_size)}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredDatasets.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <span style={{ display: 'block', marginBottom: '8px', opacity: 0.5, color: currentMode.color }}>
              {mode === 'legal' ? <ScaleIcon /> : <DataIcon />}
            </span>
            <p className="text-xs">No {mode === 'legal' ? 'documents' : 'datasets'} yet</p>
            <p className="text-xs text-gray-300 mt-1">Upload to get started</p>
          </div>
        )}
      </div>

      {/* Comparison badge */}
      {state.compareDatasets.length > 0 && (
        <div className="mx-3 mb-3 p-3 rounded-lg" style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                Comparing {state.compareDatasets.length} files
              </p>
              <p className="text-xs" style={{ color: '#b45309' }}>
                Explore → Compare tab
              </p>
            </div>
            <button
              onClick={clearCompareDatasets}
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ color: '#92400e', background: '#fde68a' }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Quick action */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setStage('upload')}
          className="w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors"
          style={{
            color: '#fff',
            background: currentMode.bgGradient,
          }}
        >
          + Upload {mode === 'legal' ? 'Document' : 'Dataset'}
        </button>
      </div>
    </div>
  );
};
