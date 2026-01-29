import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import logoImage from '../../assets/logo.png';
import { Spinner } from '../common/Spinner';

type ContentType = 'data' | 'documents' | 'images' | 'audio' | 'video';

interface ContentCategory {
  id: ContentType;
  label: string;
  icon: React.ReactNode;
  accept: string;
  enabled: boolean;
  description: string;
  features: string[];
}

const CATEGORIES: ContentCategory[] = [
  {
    id: 'data',
    label: 'Data',
    accept: '.csv,.xlsx,.xls,.json',
    enabled: true,
    description: 'Analyze structured data',
    features: ['CSV, Excel, JSON', 'AI-powered insights', 'Multi-dataset correlation'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    id: 'documents',
    label: 'Documents',
    accept: '.pdf,.doc,.docx,.txt,.md',
    enabled: true,
    description: 'Analyze text & PDFs',
    features: ['PDF, Word, Text files', 'Contract analysis', 'Document comparison'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'images',
    label: 'Images',
    accept: '.png,.jpg,.jpeg,.gif,.webp',
    enabled: false,
    description: 'Visual AI analysis',
    features: ['OCR text extraction', 'Object detection', 'Image classification'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'audio',
    label: 'Audio',
    accept: '.mp3,.wav,.m4a,.ogg',
    enabled: false,
    description: 'Speech & sound analysis',
    features: ['Speech-to-text', 'Sentiment analysis', 'Speaker identification'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: 'video',
    label: 'Video',
    accept: '.mp4,.mov,.avi,.webm',
    enabled: false,
    description: 'Video intelligence',
    features: ['Frame analysis', 'Action recognition', 'Content moderation'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export const DatasetSidebar = () => {
  const { state, selectDataset, uploadDataset, setStage, toggleCompareDataset, clearCompareDatasets } = useWorkspace();
  const [activeCategory, setActiveCategory] = useState<ContentType>('data');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredDatasetId, setHoveredDatasetId] = useState<number | null>(null);
  const [isDropzoneHovered, setIsDropzoneHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!;

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
    if (!currentCategory.enabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (currentCategory.enabled) {
      setIsDragOver(true);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter datasets by type field (contains file type like 'csv', 'pdf', etc.)
  const filteredDatasets = state.datasets.filter((ds) => {
    const fileType = ds.type?.toLowerCase() || '';
    if (activeCategory === 'data') {
      return ['csv', 'xlsx', 'xls', 'json', 'excel'].includes(fileType);
    }
    if (activeCategory === 'documents') {
      return ['pdf', 'doc', 'docx', 'txt', 'md', 'text'].includes(fileType);
    }
    return false;
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

      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Files</h2>
      </div>

      {/* Category selector */}
      <div className="p-3 border-b border-gray-100">
        <div className="grid grid-cols-5 gap-1 p-1 bg-gray-100 rounded-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="relative flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all"
              style={{
                background: activeCategory === cat.id ? '#fff' : 'transparent',
                boxShadow: activeCategory === cat.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              title={cat.label}
            >
              <span style={{ color: activeCategory === cat.id ? '#0d9488' : '#6b7280' }}>
                {cat.icon}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  marginTop: '2px',
                  color: activeCategory === cat.id ? '#0d9488' : '#9ca3af',
                  fontWeight: activeCategory === cat.id ? 600 : 500,
                }}
              >
                {cat.label}
              </span>
              {!cat.enabled && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#fbbf24',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon state for disabled categories */}
      {!currentCategory.enabled && (
        <div className="flex-1 flex flex-col p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Hero section */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
                }}
              >
                <span style={{ color: '#0d9488' }}>{currentCategory.icon}</span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f766e', margin: '0 0 4px 0' }}>
                {currentCategory.label} Analysis
              </h3>
              <p style={{ fontSize: '13px', color: '#14b8a6', margin: 0 }}>
                {currentCategory.description}
              </p>
            </div>

            {/* Features list */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Capabilities
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentCategory.features.map((feature, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <svg style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coming soon badge */}
            <div
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginTop: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <svg style={{ width: '16px', height: '16px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>Coming Soon</span>
              </div>
              <p style={{ fontSize: '12px', color: '#b45309', margin: 0 }}>
                In active development
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active category content */}
      {currentCategory.enabled && (
        <>
          {/* Upload dropzone */}
          <div
            className="mx-3 mt-3 p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all"
            style={
              isDragOver
                ? { borderColor: '#0d9488', background: '#f0fdfa' }
                : isDropzoneHovered
                  ? { borderColor: '#5eead4', background: '#f9fafb' }
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
              accept={currentCategory.accept}
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
              <>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isDragOver ? '#ccfbf1' : '#f0fdfa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: '#0d9488' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Drop files here</p>
                <p className="text-xs text-gray-400 mt-1">{currentCategory.features[0]}</p>
              </>
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
                        ? { background: '#f0fdfa', border: '1px solid #99f6e4' }
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
                          <span style={{ color: isActive ? '#0d9488' : isInCompare ? '#d97706' : '#9ca3af' }}>
                            {currentCategory.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: isActive ? '#0f766e' : isInCompare ? '#92400e' : '#111827' }}
                            >
                              {ds.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ds.row_count > 0 ? `${ds.row_count} rows` : 'Document'} &middot; {formatSize(ds.file_size)}
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
                <span style={{ display: 'block', marginBottom: '8px', opacity: 0.5 }}>{currentCategory.icon}</span>
                <p className="text-xs">No files yet</p>
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
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              }}
            >
              + Upload {currentCategory.label}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
